'use strict';
/**
 * Анализ data/random-battles/gen9/sets.json
 *
 * Запуск из корня pokemon-showdown:
 *   node analyze-sets.js
 *   node analyze-sets.js --list                     # вывести списки покемонов по категориям
 *   node analyze-sets.js --by-set                   # считать каждый сет отдельно, а не покемона целиком
 *   node analyze-sets.js --sets path/to/sets.json
 *   node analyze-sets.js --json out.json --csv out.csv
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------- аргументы
const argv = process.argv.slice(2);
function arg(name, def = null) {
	const i = argv.indexOf(name);
	return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : def;
}
const OPTS = {
	setsPath: arg('--sets', path.resolve(process.cwd(), 'data/random-battles/gen9/sets.json')),
	list: argv.includes('--list'),
	bySet: argv.includes('--by-set'),
	json: arg('--json'),
	csv: arg('--csv'),
};

// ---------------------------------------------------------------- загрузка Dex
function loadDex() {
	const tries = [
		'./dist/sim/dex',              // собранный JS (обычный случай)
		'./.sim-dist/dex',             // старые версии PS
		'./sim/dex',                   // если запускается через ts-node
		'pokemon-showdown',            // установлен как пакет
		'pokemon-showdown/dist/sim/dex',
	];
	const errors = [];
	for (const p of tries) {
		try {
			const mod = require(p.startsWith('.') ? path.resolve(process.cwd(), p) : p);
			if (mod && mod.Dex) return mod.Dex;
		} catch (e) {
			errors.push(`${p}: ${e.message.split('\n')[0]}`);
		}
	}
	throw new Error(
		'Не удалось загрузить Dex. Запусти скрипт из корня pokemon-showdown ' +
		'и убедись, что проект собран (`npm run build`).\n' + errors.join('\n')
	);
}

const Dex = loadDex().mod('gen9');

// ---------------------------------------------------------------- классификация ходов

/** Ходы с фиксированным/нестандартным уроном, не зависящим от Atk/SpA. */
const FIXED_DAMAGE = new Set([
	'seismictoss', 'nightshade', 'dragonrage', 'sonicboom', 'psywave',
	'superfang', 'naturesmadness', 'ruination', 'endeavor', 'finalgambit',
	'guardianofalola', 'bide', 'counter', 'mirrorcoat', 'metalburst', 'comeuppance',
]);

const KIND = {
	PHYSICAL: 'physical',
	SPECIAL: 'special',
	STATUS: 'status',
	FIXED: 'fixed',       // постоянный урон (Night Shade, Seismic Toss, Super Fang...)
	FOULPLAY: 'foulplay', // бьёт чужой атакой
	BODYPRESS: 'bodypress', // бьёт своей защитой
	UNKNOWN: 'unknown',
};

const moveKindCache = new Map();
function moveKind(moveName) {
	if (moveKindCache.has(moveName)) return moveKindCache.get(moveName);
	const move = Dex.moves.get(moveName);
	let kind;
	if (!move.exists) {
		kind = KIND.UNKNOWN;
	} else if (move.id === 'bodypress' || move.overrideOffensiveStat === 'def') {
		kind = KIND.BODYPRESS;
	} else if (move.category === 'Status') {
		kind = KIND.STATUS;
	} else if (move.id === 'foulplay' || move.overrideOffensivePokemon === 'target') {
		kind = KIND.FOULPLAY;
	} else if (
		FIXED_DAMAGE.has(move.id) ||
		move.damage !== undefined ||                     // damage: 40 / 'level'
		typeof move.damageCallback === 'function' ||     // Super Fang, Endeavor, ...
		move.ohko
	) {
		kind = KIND.FIXED;
	} else {
		kind = move.category === 'Physical' ? KIND.PHYSICAL : KIND.SPECIAL;
	}
	moveKindCache.set(moveName, kind);
	return kind;
}

/** Флаги по списку ходов. */
function analyzeMovepool(moves) {
	const flags = {
		physical: false, special: false, fixed: false, foulPlay: false, bodyPress: false,
		unknown: [],
	};
	for (const m of moves) {
		switch (moveKind(m)) {
		case KIND.PHYSICAL: flags.physical = true; break;
		case KIND.SPECIAL: flags.special = true; break;
		case KIND.FIXED: flags.fixed = true; break;
		case KIND.FOULPLAY: flags.foulPlay = true; break;
		case KIND.BODYPRESS: flags.bodyPress = true; break;
		case KIND.UNKNOWN: flags.unknown.push(m); break;
		default: break; // status
		}
	}
	return flags;
}

/**
 * Основная категория: только физ / только спец / обе / без обычных атак.
 * Body Press, Foul Play и фиксированный урон сюда НЕ считаются —
 * они выделены в отдельные (пересекающиеся) категории.
 */
function mainCategory(flags) {
	if (flags.physical && flags.special) return 'mixed';
	if (flags.physical) return 'physical-only';
	if (flags.special) return 'special-only';
	return 'no-standard-attacks';
}

// ---------------------------------------------------------------- сбор записей

const raw = JSON.parse(fs.readFileSync(OPTS.setsPath, 'utf8'));

/** @type {{name: string, species: string, role: string|null, level: number, baseStats: object, flags: object}[]} */
const entries = [];
const missingSpecies = [];
const unknownMoves = new Set();

for (const [key, data] of Object.entries(raw)) {
	const species = Dex.species.get(key);
	if (!species.exists) {
		missingSpecies.push(key);
		continue;
	}
	const sets = data.sets || [];

	if (OPTS.bySet) {
		for (const set of sets) {
			const flags = analyzeMovepool(set.movepool || []);
			flags.unknown.forEach(m => unknownMoves.add(m));
			entries.push({
				name: key, species: species.name, role: set.role || null,
				level: data.level, baseStats: species.baseStats, flags,
			});
		}
	} else {
		const allMoves = [];
		for (const set of sets) allMoves.push(...(set.movepool || []));
		const flags = analyzeMovepool(allMoves);
		flags.unknown.forEach(m => unknownMoves.add(m));
		entries.push({
			name: key, species: species.name, role: sets.map(s => s.role).join(' / ') || null,
			level: data.level, baseStats: species.baseStats, flags,
		});
	}
}

// ---------------------------------------------------------------- категории

/** Категории могут пересекаться: покемон с Body Press попадёт и в свою основную. */
const categories = new Map();
function push(cat, entry) {
	if (!categories.has(cat)) categories.set(cat, []);
	categories.get(cat).push(entry);
}

for (const e of entries) {
	push(mainCategory(e.flags), e);
	if (e.flags.fixed || e.flags.foulPlay) push('fixed-damage / foul-play', e);
	if (e.flags.fixed) push('  └ fixed-damage', e);
	if (e.flags.foulPlay) push('  └ foul-play', e);
	if (e.flags.bodyPress) push('body-press', e);
	push('ALL', e);
}

// ---------------------------------------------------------------- статистика

function stats(values) {
	if (!values.length) return { min: null, max: null, avg: null };
	let min = Infinity, max = -Infinity, sum = 0;
	for (const v of values) {
		if (v < min) min = v;
		if (v > max) max = v;
		sum += v;
	}
	return { min, max, avg: +(sum / values.length).toFixed(2) };
}

function summarize(name, list) {
	const atk = list.map(e => e.baseStats.atk);
	const spa = list.map(e => e.baseStats.spa);
	const def = list.map(e => e.baseStats.def);
	const diff = list.map(e => e.baseStats.atk - e.baseStats.spa);
	const absDiff = diff.map(Math.abs);

	const s = (arr) => stats(arr);
	const [sAtk, sSpa, sDef, sDiff, sAbs] = [s(atk), s(spa), s(def), s(diff), s(absDiff)];

	return {
		category: name,
		count: list.length,
		atkMin: sAtk.min, atkMax: sAtk.max, atkAvg: sAtk.avg,
		spaMin: sSpa.min, spaMax: sSpa.max, spaAvg: sSpa.avg,
		defMin: sDef.min, defMax: sDef.max, defAvg: sDef.avg,
		diffMin: sDiff.min, diffMax: sDiff.max, diffAvg: sDiff.avg,
		absDiffMin: sAbs.min, absDiffMax: sAbs.max, absDiffAvg: sAbs.avg,
	};
}

const ORDER = [
	'physical-only', 'special-only', 'mixed', 'no-standard-attacks',
	'fixed-damage / foul-play', '  └ fixed-damage', '  └ foul-play',
	'body-press', 'ALL',
];

const report = ORDER
	.filter(c => categories.has(c))
	.map(c => summarize(c, categories.get(c)));

// ---------------------------------------------------------------- вывод

console.log(`\nИсточник: ${OPTS.setsPath}`);
console.log(`Записей: ${entries.length} (${OPTS.bySet ? 'по сетам' : 'по покемонам'})\n`);

console.log('--- Atk / SpA / Def (base stats) ---');
console.table(report.map(r => ({
	category: r.category, n: r.count,
	'Atk min': r.atkMin, 'Atk max': r.atkMax, 'Atk avg': r.atkAvg,
	'SpA min': r.spaMin, 'SpA max': r.spaMax, 'SpA avg': r.spaAvg,
	'Def min': r.defMin, 'Def max': r.defMax, 'Def avg': r.defAvg,
})));

console.log('--- Разница Atk - SpA ---');
console.table(report.map(r => ({
	category: r.category, n: r.count,
	'diff min': r.diffMin, 'diff max': r.diffMax, 'diff avg': r.diffAvg,
	'|diff| min': r.absDiffMin, '|diff| max': r.absDiffMax, '|diff| avg': r.absDiffAvg,
})));

if (OPTS.list) {
	for (const cat of ORDER) {
		if (!categories.has(cat)) continue;
		const names = categories.get(cat).map(e => e.species + (OPTS.bySet && e.role ? ` [${e.role}]` : ''));
		console.log(`\n### ${cat} (${names.length})\n${names.join(', ')}`);
	}
	console.log();
}

if (missingSpecies.length) {
	console.warn(`\n[!] Не найдены в Dex (${missingSpecies.length}): ${missingSpecies.join(', ')}`);
}
if (unknownMoves.size) {
	console.warn(`[!] Неизвестные ходы: ${[...unknownMoves].join(', ')}`);
}

if (OPTS.json) {
	fs.writeFileSync(OPTS.json, JSON.stringify({
		summary: report,
		pokemon: entries.map(e => ({
			id: e.name, species: e.species, role: e.role, level: e.level,
			category: mainCategory(e.flags),
			flags: { fixed: e.flags.fixed, foulPlay: e.flags.foulPlay, bodyPress: e.flags.bodyPress },
			baseStats: e.baseStats,
			atkMinusSpa: e.baseStats.atk - e.baseStats.spa,
		})),
	}, null, 2));
	console.log(`JSON сохранён: ${OPTS.json}`);
}

if (OPTS.csv) {
	const cols = Object.keys(report[0]);
	const csv = [cols.join(','), ...report.map(r => cols.map(c => r[c]).join(','))].join('\n');
	fs.writeFileSync(OPTS.csv, csv);
	console.log(`CSV сохранён: ${OPTS.csv}`);
}
