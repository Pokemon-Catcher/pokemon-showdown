'use strict';
/**
 * Поиск приёмов, которые встречаются ИСКЛЮЧИТЕЛЬНО в паре с другим приёмом.
 *
 * Пара (A, B) попадает в результат, если хотя бы в одну сторону выполняется
 * "A никогда не встречается без B" (conf(A->B) >= --conf, по умолчанию 1.0).
 *
 * Запуск из корня pokemon-showdown:
 *   node find-move-pairs.js                       # дефолт: support>=3, conf=1.0, lift>=3
 *   node find-move-pairs.js --mutual              # только взаимно эксклюзивные пары (A<->B)
 *   node find-move-pairs.js --min 2 --conf 0.9 --lift 4
 *   node find-move-pairs.js --by-pokemon          # объединять все сеты покемона в один пул
 *   node find-move-pairs.js --names               # печатать "Light Screen" вместо "lightscreen"
 *   node find-move-pairs.js --out MOVE_PAIRS.js --table
 */

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------- аргументы
const argv = process.argv.slice(2);
function arg(name, def) {
	const i = argv.indexOf(name);
	if (i === -1 || !argv[i + 1] || argv[i + 1].startsWith('--')) return def;
	return argv[i + 1];
}
const OPTS = {
	setsPath: arg('--sets', path.resolve(process.cwd(), 'data/random-battles/gen9/sets.json')),
	minSupport: Number(arg('--min', 3)),   // минимум совместных появлений
	minConf: Number(arg('--conf', 1)),     // 1.0 = «никогда не встречается без пары»
	minLift: Number(arg('--lift', 3)),     // отсекает случайные совпадения с частыми ходами
	mutual: argv.includes('--mutual'),     // требовать эксклюзивность в обе стороны
	byPokemon: argv.includes('--by-pokemon'),
	names: argv.includes('--names'),
	table: argv.includes('--table'),
	out: arg('--out', null),
};

// ---------------------------------------------------------------- данные
const raw = JSON.parse(fs.readFileSync(OPTS.setsPath, 'utf8'));

const toID = (s) => ('' + s).toLowerCase().replace(/[^a-z0-9]+/g, '');
const displayName = new Map(); // id -> "Light Screen"

/** @type {string[][]} каждый элемент — список id ходов одного сета (или покемона) */
const pools = [];
for (const key of Object.keys(raw)) {
	const sets = raw[key].sets || [];
	if (OPTS.byPokemon) {
		const all = [];
		for (const s of sets) all.push(...(s.movepool || []));
		if (all.length) pools.push(uniqIDs(all));
	} else {
		for (const s of sets) {
			if (s.movepool && s.movepool.length) pools.push(uniqIDs(s.movepool));
		}
	}
}

function uniqIDs(moves) {
	const out = new Set();
	for (const m of moves) {
		const id = toID(m);
		if (!displayName.has(id)) displayName.set(id, m);
		out.add(id);
	}
	return [...out].sort();
}

// ---------------------------------------------------------------- подсчёт
const total = pools.length;
const count = new Map();     // move -> в скольких пулах встречается
const co = new Map();        // "a|b" -> в скольких пулах встречаются вместе

for (const pool of pools) {
	for (const m of pool) count.set(m, (count.get(m) || 0) + 1);
	for (let i = 0; i < pool.length; i++) {
		for (let j = i + 1; j < pool.length; j++) {
			const k = pool[i] + '|' + pool[j];
			co.set(k, (co.get(k) || 0) + 1);
		}
	}
}

// ---------------------------------------------------------------- отбор пар
const rows = [];
for (const [k, support] of co) {
	if (support < OPTS.minSupport) continue;
	const [a, b] = k.split('|');
	const ca = count.get(a), cb = count.get(b);
	const confAB = support / ca; // доля сетов с A, где есть и B
	const confBA = support / cb;
	const lift = (support * total) / (ca * cb);

	const ok = OPTS.mutual ?
		(confAB >= OPTS.minConf && confBA >= OPTS.minConf) :
		(confAB >= OPTS.minConf || confBA >= OPTS.minConf);
	if (!ok || lift < OPTS.minLift) continue;

	rows.push({
		a, b, support, countA: ca, countB: cb,
		confAB: +confAB.toFixed(3), confBA: +confBA.toFixed(3),
		lift: +lift.toFixed(1),
		direction: confAB >= 1 && confBA >= 1 ? 'A <-> B' : (confAB >= confBA ? 'A -> B' : 'B -> A'),
	});
}

// уникальность пар гарантирована ключом "a|b" (a < b лексикографически)
rows.sort((x, y) => y.support - x.support || x.a.localeCompare(y.a));

// ---------------------------------------------------------------- вывод
const fmt = (id) => OPTS.names ? (displayName.get(id) || id) : id;

const body = rows.map(r => `\t["${fmt(r.a)}", "${fmt(r.b)}"],`).join('\n');
const constBlock = `const MOVE_PAIRS = [\n${body}\n];\n`;

console.log(
	`\n// Источник: ${OPTS.setsPath}` +
	`\n// Пулов: ${total} (${OPTS.byPokemon ? 'по покемонам' : 'по сетам'}), ` +
	`уникальных ходов: ${count.size}` +
	`\n// Фильтры: support>=${OPTS.minSupport}, conf>=${OPTS.minConf}, lift>=${OPTS.minLift}` +
	`${OPTS.mutual ? ', только взаимные' : ''}` +
	`\n// Найдено пар: ${rows.length}\n`
);
console.log(constBlock);

if (OPTS.table) {
	console.table(rows.map(r => ({
		pair: `${fmt(r.a)} + ${fmt(r.b)}`,
		support: r.support,
		[`n(A)`]: r.countA,
		[`n(B)`]: r.countB,
		'conf A→B': r.confAB,
		'conf B→A': r.confBA,
		lift: r.lift,
		dir: r.direction,
	})));
}

if (OPTS.out) {
	fs.writeFileSync(OPTS.out, constBlock);
	console.log(`Записано в ${OPTS.out}`);
}
