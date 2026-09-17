import { PRNG } from "../../../sim/prng";
import { FusionScript } from "../../mods/fusionmons/fusion";
import RandomTeams, { MoveCounter } from "../gen9/teams";
import { toID } from "../../../sim/dex";
import { roles } from "./roles";

const STAT_INDEPENDENT_MOVES = new Set([
	'seismictoss', 'nightshade', 'dragonrage', 'sonicboom', 'psywave',
	'superfang', 'naturesmadness', 'ruination', 'endeavor', 'finalgambit',
	'guardianofalola', 'counter', 'mirrorcoat', 'metalburst', 'comeuppance',
	'foulplay', 'bodypress',
]);
// Moves that restore HP:
const RECOVERY_MOVES = [
	"healorder",
	"milkdrink",
	"moonlight",
	"morningsun",
	"recover",
	"roost",
	"shoreup",
	"slackoff",
	"softboiled",
	"strengthsap",
	"synthesis",
];
// Moves that drop stats:
const CONTRARY_MOVES = [
	"armorcannon",
	"closecombat",
	"leafstorm",
	"makeitrain",
	"overheat",
	"spinout",
	"superpower",
	"vcreate",
];
// Moves that boost Attack:
const PHYSICAL_SETUP = [
	"bellydrum",
	"bulkup",
	"coil",
	"curse",
	"dragondance",
	"honeclaws",
	"howl",
	"meditate",
	"poweruppunch",
	"swordsdance",
	"tidyup",
	"victorydance",
];
// Moves which boost Special Attack:
const SPECIAL_SETUP = [
	"calmmind",
	"chargebeam",
	"geomancy",
	"nastyplot",
	"quiverdance",
	"tailglow",
	"takeheart",
	"torchsong",
];
// Moves that boost Attack AND Special Attack:
const MIXED_SETUP = [
	"clangoroussoul",
	"growth",
	"happyhour",
	"holdhands",
	"noretreat",
	"shellsmash",
	"workup",
];
// Some moves that only boost Speed:
const SPEED_SETUP = [
	"agility",
	"autotomize",
	"flamecharge",
	"rockpolish",
	"snowscape",
	"trailblaze",
];
// Conglomerate for ease of access
const SETUP = [
	"acidarmor",
	"agility",
	"autotomize",
	"bellydrum",
	"bulkup",
	"calmmind",
	"clangoroussoul",
	"coil",
	"cosmicpower",
	"curse",
	"dragondance",
	"flamecharge",
	"growth",
	"honeclaws",
	"howl",
	"irondefense",
	"meditate",
	"nastyplot",
	"noretreat",
	"poweruppunch",
	"quiverdance",
	"rockpolish",
	"shellsmash",
	"shiftgear",
	"swordsdance",
	"tailglow",
	"takeheart",
	"tidyup",
	"trailblaze",
	"workup",
	"victorydance",
];
const SPEED_CONTROL = [
	"electroweb",
	"glare",
	"icywind",
	"lowsweep",
	"nuzzle",
	"quash",
	"tailwind",
	"thunderwave",
	"trickroom",
];
// Moves that shouldn't be the only STAB moves:
const NO_STAB = [
	"acidspray",
	"accelerock",
	"aquajet",
	"bounce",
	"breakingswipe",
	"bulletpunch",
	"chatter",
	"chloroblast",
	"clearsmog",
	"covet",
	"dragontail",
	"doomdesire",
	"electroweb",
	"eruption",
	"explosion",
	"fakeout",
	"feint",
	"flamecharge",
	"flipturn",
	"futuresight",
	"grassyglide",
	"iceshard",
	"icywind",
	"incinerate",
	"infestation",
	"machpunch",
	"meteorbeam",
	"mortalspin",
	"nuzzle",
	"pluck",
	"pursuit",
	"quickattack",
	"rapidspin",
	"reversal",
	"selfdestruct",
	"shadowsneak",
	"skydrop",
	"snarl",
	"strugglebug",
	"suckerpunch",
	"trailblaze",
	"uturn",
	"vacuumwave",
	"voltswitch",
	"watershuriken",
	"waterspout",
];
// Hazard-setting moves
const HAZARDS = ["spikes", "stealthrock", "stickyweb", "toxicspikes"];
// Protect and its variants
const PROTECT_MOVES = [
	"banefulbunker",
	"burningbulwark",
	"protect",
	"silktrap",
	"spikyshield",
];
// Moves that switch the user out
const PIVOT_MOVES = [
	"chillyreception",
	"flipturn",
	"partingshot",
	"shedtail",
	"teleport",
	"uturn",
	"voltswitch",
];

// Moves that should be paired together when possible
const MOVE_PAIRS = [
	["lightscreen", "reflect"],
	["sleeptalk", "rest"],
	["protect", "wish"],
	["leechseed", "protect"],
	["leechseed", "substitute"],
	["perishsong", "protect"],
	["bodypress", "irondefense"],
];

/** Pokemon who always want priority STAB, and are fine with it as its only STAB move of that type */
const PRIORITY_POKEMON = [
	"breloom",
	"brutebonnet",
	"cacturne",
	"honchkrow",
	"mimikyu",
	"ragingbolt",
	"scizor",
	"scizormega",
];

/** Pokemon who should never be in the lead slot */
const NO_LEAD_POKEMON = ["Zacian", "Zamazenta"];
const DOUBLES_NO_LEAD_POKEMON = [
	"Basculegion",
	"Houndstone",
	"Iron Bundle",
	"Roaring Moon",
	"Zacian",
	"Zamazenta",
];

const DEFENSIVE_TERA_BLAST_USERS = [
	"alcremie",
	"bellossom",
	"comfey",
	"fezandipiti",
	"florges",
];

export default class RandomFusionmonsTeams extends RandomTeams {
	constructor(format: Format | string, prng: PRNG | PRNGSeed | null) {
		super(format, prng);
		for (let i in this.moveEnforcementCheckers) {
			this.moveEnforcementCheckers[i] = (
				movePool,
				moves,
				abilities,
				types,
				counter,
				species,
				teamDetails,
				isLead,
				isDoubles,
			) => !counter.get(i);
		}
	}
	shuffleSets(
		set: RandomTeamsTypes.RandomSet,
		set2: RandomTeamsTypes.RandomSet,
	) {
		set.ability = this.random() > 0.5 ? set.ability : set2.ability;
		const learnset = FusionScript.fuseLearnsets(
			Dex.species.get(set.species),
			Dex.species.get(set2.species),
		);
		const moveset = new Set(
			[...set.moves, ...set2.moves].filter((m: string) =>
				learnset.has(toID(m)),
			),
		);
		let length = [...moveset].length;
		if (length <= 4) {
			set.moves = [...moveset];
			if (length < 4) {
				const d = learnset.difference(moveset);
				const sets1: RandomTeamsTypes.RandomSetData[] =
					this[`randomSets`][set.speciesId ?? ""]["sets"] ?? [];
				const sets2: RandomTeamsTypes.RandomSetData[] =
					this[`randomSets`][set2.speciesId ?? ""]["sets"] ?? [];
				let usefulMoves = new Set<ID>();
				for (let s of sets1) {
					for (const m of s.movepool) {
						usefulMoves.add(toID(m));
					}
				}
				for (let s of sets2) {
					for (const m of s.movepool) {
						usefulMoves.add(toID(m));
					}
				}
				const usefulLearnset = d.intersection<ID>(usefulMoves);
				let arr = [...d];
				let arr2 = [...usefulLearnset];
				for (let i = 0; i < 4 - set.moves.length && arr2.length > 0; i++) {
					let move = arr2[this.random(0, arr2.length)];
					set.moves.push(move);
					d.delete(move);
					arr2 = [...usefulLearnset];
				}
				for (let i = 0; i < 4 - set.moves.length && arr.length > 0; i++) {
					let move = arr[this.random(0, arr.length)];
					set.moves.push(move);
					d.delete(move);
					arr = [...d];
				}
			}
		} else {
			for (let i = 0; i < 4; i++) {
				set.moves[i] = [...moveset][this.random(0, length)];
				moveset.delete(set.moves[i]);
				length--;
			}
		}

		set.item = this.random() > 0.5 ? set.item : set2.item;
		set.name = `+${set2.species}`;
		set.level = Math.min(set.level, set2.level);
		return set;
	}
	override randomTeam() {
		const seed = this.prng.getSeed();
		const ruleTable = this.dex.formats.getRuleTable(this.format);
		const pokemon: RandomTeamsTypes.RandomSet[] = [];

		// For Monotype
		const isMonotype =
			!!this.forceMonotype || ruleTable.has("sametypeclause");
		const isDoubles = this.format.gameType !== "singles";
		const typePool = this.dex.types
			.names()
			.filter((name) => name !== "Stellar");
		const type = this.forceMonotype || this.sample(typePool);

		// PotD stuff
		const usePotD = global.Config && Config.potd && ruleTable.has("potd");
		const potd = usePotD ? this.dex.species.get(Config.potd) : null;

		const baseFormes: { [k: string]: number } = {};

		const typeCount: { [k: string]: number } = {};
		const typeComboCount: { [k: string]: number } = {};
		const typeWeaknesses: { [k: string]: number } = {};
		const typeDoubleWeaknesses: { [k: string]: number } = {};
		const teamDetails: RandomTeamsTypes.TeamDetails = {};
		let numMaxLevelPokemon = 0;

		const pokemonList = isDoubles
			? Object.keys(this.randomDoublesSets)
			: Object.keys(this.randomSets);
		const [pokemonPool, baseSpeciesPool] = this.getPokemonPool(
			type,
			pokemon,
			isMonotype,
			pokemonList,
		);

		let leadsRemaining = this.format.gameType === "doubles" ? 2 : 1;
		while (baseSpeciesPool.length && pokemon.length < this.maxTeamSize) {
			const baseSpecies = this.sampleNoReplace(baseSpeciesPool);

			let species = this.dex.species.get(
				this.sample(pokemonPool[baseSpecies]),
			);

			if (!species.exists) continue;

			// Limit to one of each species (Species Clause)
			if (baseFormes[species.baseSpecies]) continue;
			const baseSpecies2 = this.sampleNoReplace(baseSpeciesPool);
			let species2 = this.dex.species.get(
				this.sample(pokemonPool[baseSpecies2]),
			);
			if (!species2.exists) continue;

			// Limit to one of each species (Species Clause)
			if (baseFormes[species2.baseSpecies]) continue;
			// Treat Ogerpon formes and Terapagos like the Tera Blast user role; reject if team has one already
			if (
				(["ogerpon", "ogerponhearthflame", "terapagos"].includes(
					species.id,
				) ||
					["ogerpon", "ogerponhearthflame", "terapagos"].includes(
						species2.id,
					)) &&
				teamDetails.teraBlast
			)
				continue;

			// Illusion shouldn't be on the last slot
			if (
				(species.baseSpecies === "Zoroark" ||
					species2.baseSpecies === "Zoroark") &&
				pokemon.length >= this.maxTeamSize - 1
			)
				continue;

			const types = FusionScript.fuseTypes(species.types, species2.types);
			const typeCombo = types.slice().sort().join();
			const weakToFreezeDry =
				this.dex.getEffectiveness("Ice", species) > 0 ||
				(this.dex.getEffectiveness("Ice", species) > -2 &&
					types.includes("Water"));
			// Dynamically scale limits for different team sizes. The default and minimum value is 1.
			const limitFactor = Math.round(this.maxTeamSize / 6) || 1;

			if (!isMonotype && !this.forceMonotype) {
				let skip = false;

				// Limit two of any type
				for (const typeName of types) {
					if (typeCount[typeName] >= 2 * limitFactor) {
						skip = true;
						break;
					}
				}
				if (skip) continue;

				// Limit three weak to any type, and one double weak to any type
				for (const typeName of this.dex.types.names()) {
					// it's weak to the type
					if (this.dex.getEffectiveness(typeName, species) > 0) {
						if (!typeWeaknesses[typeName]) typeWeaknesses[typeName] = 0;
						if (typeWeaknesses[typeName] >= 3 * limitFactor) {
							skip = true;
							break;
						}
					}
					if (this.dex.getEffectiveness(typeName, species) > 1) {
						if (!typeDoubleWeaknesses[typeName])
							typeDoubleWeaknesses[typeName] = 0;
						if (typeDoubleWeaknesses[typeName] >= limitFactor) {
							skip = true;
							break;
						}
					}
				}
				if (skip) continue;

				// Count Dry Skin/Fluffy as Fire weaknesses
				if (
					this.dex.getEffectiveness("Fire", species) === 0 &&
					Object.values(species.abilities).filter((a) =>
						["Dry Skin", "Fluffy"].includes(a),
					).length
				) {
					if (!typeWeaknesses["Fire"]) typeWeaknesses["Fire"] = 0;
					if (typeWeaknesses["Fire"] >= 3 * limitFactor) continue;
				}

				// Limit four weak to Freeze-Dry
				if (weakToFreezeDry) {
					if (!typeWeaknesses["Freeze-Dry"])
						typeWeaknesses["Freeze-Dry"] = 0;
					if (typeWeaknesses["Freeze-Dry"] >= 4 * limitFactor) continue;
				}

				// Limit one level 100 Pokemon
				if (
					!this.adjustLevel &&
					this.getLevel(species, isDoubles) === 100 &&
					numMaxLevelPokemon >= limitFactor
				) {
					continue;
				}

				// Check compatibility with team
				if (!this.getPokemonCompatibility(species, pokemon, isDoubles))
					continue;
			}

			// Limit three of any type combination in Monotype
			if (
				!this.forceMonotype &&
				isMonotype &&
				typeComboCount[typeCombo] >= 3 * limitFactor
			)
				continue;

			// The Pokemon of the Day
			if (potd?.exists && (pokemon.length === 1 || this.maxTeamSize === 1)) {
				if (this.random() > 0.5) species = potd;
				else {
					species2 = potd;
				}
			}
			let set: RandomTeamsTypes.RandomSet;
			let set2: RandomTeamsTypes.RandomSet;

			if (leadsRemaining) {
				if (
					(isDoubles &&
						DOUBLES_NO_LEAD_POKEMON.includes(species.baseSpecies)) ||
					(!isDoubles && NO_LEAD_POKEMON.includes(species.baseSpecies))
				) {
					if (pokemon.length + leadsRemaining === this.maxTeamSize)
						continue;
					set = this.randomFusionSet(
						species,
						species2,
						teamDetails,
						false,
						isDoubles,
					);
					pokemon.push(set);
				} else {
					set = this.randomFusionSet(
						species,
						species2,
						teamDetails,
						true,
						isDoubles,
					);
					pokemon.unshift(set);

					leadsRemaining--;
				}
			} else {
				set = this.randomFusionSet(
					species,
					species2,
					teamDetails,
					false,
					isDoubles,
				);
				pokemon.push(set);
			}

			// Don't bother tracking details for the last Pokemon
			if (pokemon.length === this.maxTeamSize) break;

			// Now that our Pokemon has passed all checks, we can increment our counters
			baseFormes[species.baseSpecies] = 1;
			baseFormes[species2.baseSpecies] = 1;

			// Increment type counters
			for (const typeName of types) {
				if (typeName in typeCount) {
					typeCount[typeName]++;
				} else {
					typeCount[typeName] = 1;
				}
			}
			if (typeCombo in typeComboCount) {
				typeComboCount[typeCombo]++;
			} else {
				typeComboCount[typeCombo] = 1;
			}

			const fusedTypesSpecies = { ...species, types: types };
			// Increment weakness counter
			for (const typeName of this.dex.types.names()) {
				// it's weak to the type
				if (this.dex.getEffectiveness(typeName, fusedTypesSpecies) > 0) {
					typeWeaknesses[typeName]++;
				}
				if (this.dex.getEffectiveness(typeName, fusedTypesSpecies) > 1) {
					typeDoubleWeaknesses[typeName]++;
				}
			}
			// Count Dry Skin/Fluffy as Fire weaknesses
			if (
				["Dry Skin", "Fluffy"].includes(set.ability) &&
				this.dex.getEffectiveness("Fire", fusedTypesSpecies) === 0
			) {
				typeWeaknesses["Fire"]++;
			}
			if (weakToFreezeDry) typeWeaknesses["Freeze-Dry"]++;

			// Increment level 100 counter
			if (set.level === 100) numMaxLevelPokemon++;

			// Track what the team has
			if (set.ability === "Drizzle" || set.moves.includes("raindance"))
				teamDetails.rain = 1;
			if (
				set.ability === "Drought" ||
				set.ability === "Orichalcum Pulse" ||
				set.moves.includes("sunnyday")
			) {
				teamDetails.sun = 1;
			}
			if (set.ability === "Sand Stream") teamDetails.sand = 1;
			if (
				set.ability === "Snow Warning" ||
				set.moves.includes("snowscape") ||
				set.moves.includes("chillyreception")
			) {
				teamDetails.snow = 1;
			}
			if (set.moves.includes("healbell")) teamDetails.statusCure = 1;
			if (
				set.moves.includes("spikes") ||
				set.moves.includes("ceaselessedge")
			) {
				teamDetails.spikes = (teamDetails.spikes || 0) + 1;
			}
			if (
				set.moves.includes("toxicspikes") ||
				set.ability === "Toxic Debris"
			)
				teamDetails.toxicSpikes = 1;
			if (
				set.moves.includes("stealthrock") ||
				set.moves.includes("stoneaxe")
			)
				teamDetails.stealthRock = 1;
			if (set.moves.includes("stickyweb")) teamDetails.stickyWeb = 1;
			if (set.moves.includes("defog")) teamDetails.defog = 1;
			if (
				set.moves.includes("rapidspin") ||
				set.moves.includes("mortalspin")
			)
				teamDetails.rapidSpin = 1;
			if (
				set.moves.includes("auroraveil") ||
				(set.moves.includes("reflect") && set.moves.includes("lightscreen"))
			) {
				teamDetails.screens = 1;
			}
			if (
				set.role === "Tera Blast user" ||
				["ogerpon", "ogerponhearthflame", "terapagos"].includes(
					species.id,
				) ||
				["ogerpon", "ogerponhearthflame", "terapagos"].includes(species2.id)
			) {
				teamDetails.teraBlast = 1;
			}
		}
		if (pokemon.length < this.maxTeamSize && pokemon.length < 12) {
			// large teams sometimes cannot be built
			throw new Error(
				`Could not build a random team for ${this.format} (seed=${seed})`,
			);
		}

		return pokemon;
	}

	getFusionAbility(
		types: Set<string>,
		moves: Set<string>,
		abilities: string[],
		counter: MoveCounter,
		teamDetails: RandomTeamsTypes.TeamDetails,
		species: Species,
		species2: Species,
		isLead: boolean,
		isDoubles: boolean,
		teraType: string,
		role: RandomTeamsTypes.Role,
	): string {
		if (abilities.length <= 1) return abilities[0];
		if (
			abilities.includes("Flash Fire") &&
			this.dex.getEffectiveness("Fire", teraType) >= 1
		)
			return "Flash Fire";
		if (abilities.includes("Skill Link") && counter.get("skilllink"))
			return "Skill Link";
		if (abilities.includes("Slush Rush") && moves.has("snowscape"))
			return "Slush Rush";
		if (abilities.includes("Drought") && moves.has("solarbeam"))
			return "Drought";
		if (
			abilities.includes("Multitype") &&
			(species.baseSpecies == "Arceus" || species2.baseSpecies == "Arceus")
		)
			return "Multitype";
		if(abilities.includes('Snow Warning') && moves.has('auroraveil')){
			return "Snow Warning"
		}
		if(abilities.includes('No Guard') && moves.has('dynamicpunch')){
			return "No Guard"
		}
		if(counter.get('pulse') && abilities.includes('Mega Launcher')){
			return "Mega Launcher"
		}
			
		const abilityAllowed: string[] = [];
		// Obtain a list of abilities that are allowed (not culled)
		for (const ability of abilities) {
			if (
				!this.shouldCullFusionAbility(
					ability,
					types,
					moves,
					abilities,
					counter,
					teamDetails,
					species,
					species2,
					role,
					isLead,
					isDoubles,
				)
			) {
				abilityAllowed.push(ability);
			}
		}

		// Pick a random allowed ability
		if (abilityAllowed.length >= 1) return this.sample(abilityAllowed);

		// If all abilities are rejected, prioritize weather abilities over non-weather abilities
		if (!abilityAllowed.length) {
			const weatherAbilities = abilities.filter((a) =>
				[
					"Chlorophyll",
					"Hydration",
					"Sand Force",
					"Sand Rush",
					"Slush Rush",
					"Solar Power",
					"Swift Swim",
				].includes(a),
			);
			if (weatherAbilities.length) return this.sample(weatherAbilities);
		}

		// Pick a random ability
		return this.sample(abilities);
	}
	randomFusionSet(
		s: string | Species,
		s2: string | Species,
		teamDetails: RandomTeamsTypes.TeamDetails = {},
		isLead = false,
		isDoubles = false,
	): RandomTeamsTypes.RandomSet {
		const species = this.dex.species.get(s);
		const species2 = this.dex.species.get(s2);
		const forme = this.getForme(species);
		const forme2 = this.getForme(species2);

		const sets1 =
			this[`random${isDoubles ? "Doubles" : ""}Sets`][species.id]["sets"];
		const sets2 =
			this[`random${isDoubles ? "Doubles" : ""}Sets`][species2.id]["sets"];
		const sets: RandomTeamsTypes.RandomSetData[] = [];
		const learnset = FusionScript.fuseLearnsets(species, species2);
		const fitRoles: Partial<Record<RandomTeamsTypes.Role, true>> = {};
		const allRoles = roles;
		const fusedTeraTypes = new Set<string>();
		for (let set of [...sets1, ...sets2]) {
			fitRoles[set.role] = true;
			set.teraTypes?.forEach((t) => fusedTeraTypes.add(t));
		}

		for (let i in fitRoles) {
			const movePool = learnset.intersection(
				new Set(Object.keys(allRoles[i].movepool).map(toID)),
			);
			const abilities = new Set([
				...Object.values(species.abilities),
				...Object.values(species2.abilities),
			]);
			const set: RandomTeamsTypes.RandomSetData = {
				role: i as RandomTeamsTypes.Role,
				movepool: [...movePool],
				abilities: [...abilities].filter((a) => allRoles[i].abilities[a]),
				teraTypes: [...fusedTeraTypes],
			};
			sets.push(set);
		}

		const possibleSets: RandomTeamsTypes.RandomSetData[] = [];

		const ruleTable = this.dex.formats.getRuleTable(this.format);

		for (const set of sets) {
			// Prevent Fast Bulky Setup on lead Paradox Pokemon, since it generates Booster Energy.
			const abilities = set.abilities!;
			if (
				isLead &&
				(abilities.includes("Protosynthesis") ||
					abilities.includes("Quark Drive")) &&
				set.role === "Fast Bulky Setup"
			)
				continue;
			// Prevent Tera Blast user if the team already has one, or if Terastallizion is prevented.
			if (
				(teamDetails.teraBlast || ruleTable.has("terastalclause")) &&
				set.role === "Tera Blast user"
			) {
				continue;
			}
			possibleSets.push(set);
		}
		const set = this.sampleIfArray(possibleSets);
		const role = set.role;
		const movePool: string[] = [];
		for (const movename of set.movepool) {
			movePool.push(this.dex.moves.get(movename).id);
		}
		const teraTypes = set.teraTypes!;
		let teraType = this.sampleIfArray(teraTypes);

		let ability = "";
		let item = undefined;

		const evs = { hp: 85, atk: 85, def: 85, spa: 85, spd: 85, spe: 85 };
		const ivs = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };

		const types = new Set(
			FusionScript.fuseTypes(species.types, species2.types),
		);
		const abilities = set.abilities!;

		// Get moves
		const movesUnfiltered = this.randomFusionMoveset(
			types,
			abilities,
			teamDetails,
			species,
			species2,
			isLead,
			movePool,
			teraType,
			role,
			isDoubles,
		);
		const moves = new Set(
			this.multipleSamplesNoReplace([...movesUnfiltered], this.maxMoveCount),
		);
		const counter = this.queryMoves(moves, species, teraType, abilities);

		// Get ability
		ability = this.getFusionAbility(
			types,
			moves,
			abilities,
			counter,
			teamDetails,
			species,
			species2,
			isLead,
			isDoubles,
			teraType,
			role,
		);

		// Get items
		// First, the priority items
		item = this.getFusionPriorityItem(
			ability,
			types,
			moves,
			counter,
			teamDetails,
			species,
			species2,
			isLead,
			teraType,
			role,
			isDoubles,
		);
		if (item === undefined) {
			if (isDoubles) {
				item = this.getDoublesItem(
					ability,
					types,
					moves,
					counter,
					teamDetails,
					species,
					isLead,
					teraType,
					role,
				);
			} else {
				item = this.getItem(
					ability,
					types,
					moves,
					counter,
					teamDetails,
					species,
					isLead,
					teraType,
					role,
				);
			}
		}

		// Get level
		const level1 = this.getLevel(species, isDoubles);
		const level2 = this.getLevel(species2, isDoubles);

		let level = Math.min(level1, level2);

		//FIX FOR OP MONS
		if (
			ability !== "Truant" &&
			[species.id, species2.id].includes("slaking" as ID)
		) {
			level = Math.min(level, 70);
		}
		if (
			ability !== "Slow Start" &&
			[species.id, species2.id].includes("regigigas" as ID)
		) {
			level = Math.min(level, 70);
		}

		// Prepare optimal HP
		const srImmunity =
			ability === "Magic Guard" || item === "Heavy-Duty Boots";
		let srWeakness = srImmunity
			? 0
			: this.dex.getEffectiveness("Rock", species);
		// Crash damage move users want an odd HP to survive two misses
		if (
			["axekick", "highjumpkick", "jumpkick", "supercellslam"].some((m) =>
				moves.has(m),
			)
		)
			srWeakness = 2;
		while (evs.hp > 1) {
			const hp = Math.floor(
				(Math.floor(
					2 * species.baseStats.hp + ivs.hp + Math.floor(evs.hp / 4) + 100,
				) *
					level) /
					100 +
					10,
			);
			if (
				(moves.has("substitute") && ["Sitrus Berry"].includes(item)) ||
				species.id === "minior"
			) {
				// Two Substitutes should activate Sitrus Berry. Two switch-ins to Stealth Rock should activate Shields Down on Minior.
				if (hp % 4 === 0) break;
			} else if (
				(moves.has("bellydrum") ||
					moves.has("filletaway") ||
					moves.has("shedtail")) &&
				(item === "Sitrus Berry" || ability === "Gluttony")
			) {
				// Belly Drum should activate Sitrus Berry
				if (hp % 2 === 0) break;
			} else if (moves.has("substitute") && moves.has("endeavor")) {
				// Luvdisc should be able to Substitute down to very low HP
				if (hp % 4 > 0) break;
			} else {
				// Maximize number of Stealth Rock switch-ins in singles
				if (isDoubles) break;
				if (
					srWeakness <= 0 ||
					ability === "Regenerator" ||
					["Leftovers", "Life Orb"].includes(item)
				)
					break;
				if (item !== "Sitrus Berry" && hp % (4 / srWeakness) > 0) break;
				// Minimise number of Stealth Rock switch-ins to activate Sitrus Berry
				if (item === "Sitrus Berry" && hp % (4 / srWeakness) === 0) break;
			}
			evs.hp -= 4;
		}

		// Minimize confusion damage
		const noAttackStatMoves = [...moves].every((m) => {
			const move = this.dex.moves.get(m);
			if (move.damageCallback || move.damage) return true;
			if (move.id === "shellsidearm") return false;
			// Physical Tera Blast
			if (
				move.id === "terablast" &&
				(species.id === "porygon2" ||
					["Contrary", "Defiant"].includes(ability) ||
					moves.has("shiftgear") ||
					species.baseStats.atk > species.baseStats.spa)
			)
				return false;
			return (
				move.category !== "Physical" ||
				move.id === "bodypress" ||
				move.id === "foulplay"
			);
		});
		if (
			noAttackStatMoves &&
			!moves.has("transform") &&
			this.format.mod !== "partnersincrime" &&
			!ruleTable.has("forceofthefallenmod")
		) {
			evs.atk = 0;
			ivs.atk = 0;
		}

		if (moves.has("gyroball") || moves.has("trickroom")) {
			evs.spe = 0;
			ivs.spe = 0;
		}

		// Enforce Tera Type after all set generation is done to prevent infinite generation
		if (this.forceTeraType) teraType = this.forceTeraType;

		// shuffle moves to add more randomness to camomons
		const shuffledMoves = Array.from(moves);
		this.prng.shuffle(shuffledMoves);

		return {
			name: `+${species2}`,
			species: forme,
			speciesId: species.id,
			gender:
				species.baseSpecies === "Greninja"
					? "M"
					: species.gender || (this.random(2) ? "F" : "M"),
			shiny: this.randomChance(1, 1024),
			level,
			moves: shuffledMoves,
			ability,
			evs,
			ivs,
			item,
			teraType,
			role,
		};
	}

	fastPopSafe(list: any[], index: number) {
		if (index < 0 || index >= list.length) {
			return null;
		}
		return this.fastPop(list, index);
	}

	getMovePairs(abilities: string[]) {
		const NEW_MOVE_PAIRS = [...MOVE_PAIRS];
		if (!abilities.includes("Drought")) {
			NEW_MOVE_PAIRS.push(["solarbeam", "sunnyday"]);
		}

		return NEW_MOVE_PAIRS;
	}

	cullFusionMovePool(
		types: Set<string>,
		moves: Set<string>,
		abilities: string[],
		counter: MoveCounter,
		movePool: string[],
		teamDetails: RandomTeamsTypes.TeamDetails,
		species: Species,
		species2: Species,
		isLead: boolean,
		teraType: string,
		role: RandomTeamsTypes.Role,
		isDoubles: boolean,
	): void {
		if (moves.size + movePool.length <= this.maxMoveCount) return;
		// If we have two unfilled moves and only one unpaired move, cull the unpaired move.
		const baseStats = FusionScript.fuseStatsCalculate(species,species2)
		const physGap = baseStats.atk - baseStats.spa;
		
		if(types.has('Ghost') && movePool.includes('curse')){
			this.fastPopSafe(movePool, movePool.indexOf('curse'));
		}

		if(!abilities.includes('Mega Launcher') && movePool.includes('waterpulse')){
			this.fastPopSafe(movePool, movePool.indexOf('waterpulse'));
		}

		if(species.baseSpecies !== 'Morpeko' && movePool.includes('aurawheel')){
			this.fastPopSafe(movePool, movePool.indexOf('aurawheel'));
		}

		if(species.baseSpecies !== 'Darkrai' && movePool.includes('darkvoid')){
			this.fastPopSafe(movePool, movePool.indexOf('darkvoid'));
		}

		if(baseStats.def<80 && movePool.includes('bodypress')){
			this.fastPopSafe(movePool, movePool.indexOf('bodypress'));
		}
		if(!movePool.includes('bodypress')){
			this.fastPopSafe(movePool, movePool.indexOf('irondefense'));
		}
		if(movePool.includes('dynamicpunch') && !abilities.includes('No Guard')){
			this.fastPopSafe(movePool, movePool.indexOf('dynamicpunch'));
		}

		if(!abilities.includes('Quick Feet') && !abilities.includes('Toxic Boost') && !abilities.includes('Guts') && movePool.includes('facade')){
			this.fastPopSafe(movePool, movePool.indexOf('facade'));
		}

		if (moves.size==3 && movePool.includes('storedpower')) {
			this.fastPopSafe(movePool, movePool.indexOf('storedpower'));
		}

		let shouldRemove:((move: Move) => boolean)|null=null;
		if (baseStats.atk < 65 && baseStats.spa < 65) {
			// Слабый атакующий: оставляем только статус и атаки без зависимости от Atk/SpA
			shouldRemove = move => (move.category !== 'Status' && !this.isStatIndependentAttack(move)) || PHYSICAL_SETUP.includes(move.id) || SPECIAL_SETUP.includes(move.id);
		} else if (physGap > 50 || counter.get('physicalsetup')) {
			// Явно физический: убираем спецатаки
			shouldRemove = move => (move.category === 'Special' && !this.isStatIndependentAttack(move)) || SPECIAL_SETUP.includes(move.id);
		} else if (-physGap > 50  || counter.get('specialsetup')) {
			// Явно специальный: убираем физические (Body Press и Foul Play остаются)
			shouldRemove = move => move.category === 'Physical' && !this.isStatIndependentAttack(move) || PHYSICAL_SETUP.includes(move.id);
		}
		
		if(shouldRemove){
			for (let i = movePool.length - 1; i >= 0; i--) {
				if (movePool.length <= this.maxMoveCount) break;
				const move = this.dex.moves.get(movePool[i]);
				if (shouldRemove(move)) this.fastPopSafe(movePool, i);
			}
		}
		const NEW_MOVE_PAIRS = this.getMovePairs(abilities);
		if (moves.size === this.maxMoveCount - 2) {
			const unpairedMoves = [...movePool];
			for (const pair of NEW_MOVE_PAIRS) {
				if (movePool.includes(pair[0]) && movePool.includes(pair[1])) {
					this.fastPopSafe(unpairedMoves, unpairedMoves.indexOf(pair[0]));
					this.fastPopSafe(unpairedMoves, unpairedMoves.indexOf(pair[1]));
				}
			}
			if (unpairedMoves.length === 1) {
				this.fastPopSafe(movePool, movePool.indexOf(unpairedMoves[0]));
			}
		}
		
		// These moves are paired, and shouldn't appear if there is not room for them both.
		if (moves.size === this.maxMoveCount - 1) {
			for (const pair of NEW_MOVE_PAIRS) {
				if (movePool.includes(pair[0]) && movePool.includes(pair[1])) {
					this.fastPopSafe(movePool, movePool.indexOf(pair[0]));
					this.fastPopSafe(movePool, movePool.indexOf(pair[1]));
				}
			}
		}

		// Develop additional move lists
		const statusMoves = this.cachedStatusMoves;

		// Team-based move culls
		if (teamDetails.screens) {
			if (movePool.includes("auroraveil") && !isDoubles)
				this.fastPopSafe(movePool, movePool.indexOf("auroraveil"));
			if (movePool.length >= this.maxMoveCount + 2) {
				if (movePool.includes("reflect"))
					this.fastPopSafe(movePool, movePool.indexOf("reflect"));
				if (movePool.includes("lightscreen"))
					this.fastPopSafe(movePool, movePool.indexOf("lightscreen"));
			}
		}
		if (teamDetails.stickyWeb) {
			if (movePool.includes("stickyweb"))
				this.fastPopSafe(movePool, movePool.indexOf("stickyweb"));
			if (moves.size + movePool.length <= this.maxMoveCount) return;
		}
		if (teamDetails.stealthRock) {
			if (movePool.includes("stealthrock"))
				this.fastPopSafe(movePool, movePool.indexOf("stealthrock"));
			if (moves.size + movePool.length <= this.maxMoveCount) return;
		}
		if (teamDetails.defog || teamDetails.rapidSpin) {
			if (movePool.includes("defog"))
				this.fastPopSafe(movePool, movePool.indexOf("defog"));
			if (movePool.includes("rapidspin"))
				this.fastPopSafe(movePool, movePool.indexOf("rapidspin"));
			if (moves.size + movePool.length <= this.maxMoveCount) return;
		}
		if (teamDetails.toxicSpikes) {
			if (movePool.includes("toxicspikes"))
				this.fastPopSafe(movePool, movePool.indexOf("toxicspikes"));
			if (moves.size + movePool.length <= this.maxMoveCount) return;
		}
		if (teamDetails.spikes && teamDetails.spikes >= 2) {
			if (movePool.includes("spikes"))
				this.fastPopSafe(movePool, movePool.indexOf("spikes"));
			if (moves.size + movePool.length <= this.maxMoveCount) return;
		}
		if (teamDetails.statusCure) {
			if (movePool.includes("healbell"))
				this.fastPopSafe(movePool, movePool.indexOf("healbell"));
			if (moves.size + movePool.length <= this.maxMoveCount) return;
		}

		if (isDoubles) {
			const doublesIncompatiblePairs = [
				// In order of decreasing generalizability
				[SPEED_CONTROL, SPEED_CONTROL],
				[HAZARDS, HAZARDS],
				["rockslide", "stoneedge"],
				[SETUP, ["fakeout", "helpinghand"]],
				[PROTECT_MOVES, "wideguard"],
				[["fierydance", "fireblast"], "heatwave"],
				["dazzlinggleam", ["fleurcannon", "moonblast"]],
				["poisongas", ["toxicspikes", "willowisp"]],
				[RECOVERY_MOVES, ["healpulse", "lifedew"]],
				["healpulse", "lifedew"],
				["haze", "icywind"],
				[
					["hydropump", "muddywater"],
					["muddywater", "scald"],
				],
				["disable", "encore"],
				["freezedry", "icebeam"],
				["energyball", "leafstorm"],
				["earthpower", "sandsearstorm"],
				["coaching", ["helpinghand", "howl"]],
			];

			for (const pair of doublesIncompatiblePairs)
				this.incompatibleMoves(moves, movePool, pair[0], pair[1]);

			if (role !== "Offensive Protect")
				this.incompatibleMoves(moves, movePool, PROTECT_MOVES, [
					"flipturn",
					"uturn",
				]);
		}

		// General incompatibilities
		const incompatiblePairs = [
			// These moves don't mesh well with other aspects of the set
			[statusMoves, ["healingwish", "switcheroo", "trick"]],
			[SETUP, PIVOT_MOVES],
			[SETUP, HAZARDS],
			[SETUP, ["defog", "nuzzle", "toxic", "yawn", "haze"]],
			[PHYSICAL_SETUP, PHYSICAL_SETUP],
			["substitute", PIVOT_MOVES],
			[SPEED_SETUP, ["aquajet", "rest", "trickroom"]],
			["curse", ["irondefense", "rapidspin"]],
			["dragondance", "dracometeor"],
			["yawn", "roar"],
			["trick", "uturn"],
			RECOVERY_MOVES,

			// These attacks are redundant with each other
			[
				["psychic", "psychicnoise"],
				["psyshock", "psychicnoise"],
			],
			["surf", "hydropump"],
			["liquidation", "wavecrash"],
			["aquajet", "flipturn"],
			["gigadrain", "leafstorm"],
			["powerwhip", "hornleech"],
			["airslash", "hurricane"],
			["knockoff", "foulplay"],
			["throatchop", ["crunch", "lashout"]],
			["doubleedge", ["bodyslam", "headbutt"]],
			[
				["fireblast", "magmastorm"],
				["fierydance", "flamethrower", "lavaplume"],
			],
			["thunderpunch", "wildcharge"],
			["thunderbolt", "discharge"],
			["gunkshot", ["direclaw", "poisonjab", "sludgebomb"]],
			["aurasphere", "focusblast"],
			["closecombat", "drainpunch"],
			[["dragonpulse", "spacialrend"], "dracometeor"],
			["dragonclaw", "outrage"],
			["heavyslam", "flashcannon"],
			["alluringvoice", "dazzlinggleam"],
			["thunderbolt", "discharge", "thunder"],
			// These status moves are redundant with each other
			["taunt", "disable"],
			[
				["thunderwave", "toxic"],
				["thunderwave", "willowisp"],
			],
			[["thunderwave", "toxic", "willowisp"], "toxicspikes"],

			// This space reserved for assorted hardcodes that otherwise make little sense out of context
			// Landorus and Thundurus
			["nastyplot", ["rockslide", "knockoff"]],
			// Persian
			["switcheroo", "fakeout"],
			// Amoonguss, though this can work well as a general rule later
			["toxic", "clearsmog"],
			// Chansey and Blissey
			["healbell", "stealthrock"],
			// Araquanid and Magnezone
			["mirrorcoat", ["hydropump", "bodypress"]],
		];

		for (const pair of incompatiblePairs)
			this.incompatibleMoves(moves, movePool, pair[0], pair[1]);

		if (!types.has("Ice"))
			this.incompatibleMoves(moves, movePool, "icebeam", "icywind");

		if (!isDoubles)
			this.incompatibleMoves(moves, movePool, "taunt", "encore");

		if (!types.has("Dark") && teraType !== "Dark")
			this.incompatibleMoves(moves, movePool, "knockoff", "suckerpunch");

		if (!abilities.includes("Prankster"))
			this.incompatibleMoves(moves, movePool, "thunderwave", "yawn");

		// This space reserved for assorted hardcodes that otherwise make little sense out of context:
		// To force Close Combat on Barraskewda without locking it to Tera Fighting
		if (species.id === "barraskewda") {
			this.incompatibleMoves(
				moves,
				movePool,
				["psychicfangs", "throatchop"],
				["poisonjab", "throatchop"],
			);
		}
		// To force Toxic on Quagsire
		if (species.id === "quagsire")
			this.incompatibleMoves(moves, movePool, "spikes", "icebeam");
		// Taunt/Knock should be Cyclizar's flex moveslot
		if (species.id === "cyclizar")
			this.incompatibleMoves(moves, movePool, "taunt", "knockoff");
		// To force Stealth Rock on Camerupt
		if (species.id === "camerupt")
			this.incompatibleMoves(moves, movePool, "roar", "willowisp");
		// nothing else rolls these lol
		if (species.id === "coalossal")
			this.incompatibleMoves(moves, movePool, "flamethrower", "overheat");
	}

	// Checks for and removes incompatible moves, starting with the first move in movesA.
	override incompatibleMoves(
		moves: Set<string>,
		movePool: string[],
		movesA: string | string[],
		movesB: string | string[],
	): void {
		const moveArrayA = Array.isArray(movesA) ? movesA : [movesA];
		const moveArrayB = Array.isArray(movesB) ? movesB : [movesB];
		if (moves.size + movePool.length <= this.maxMoveCount) return;
		for (const moveid1 of moves) {
			if (moveArrayB.includes(moveid1)) {
				for (const moveid2 of moveArrayA) {
					if (moveid1 !== moveid2 && movePool.includes(moveid2)) {
						this.fastPopSafe(movePool, movePool.indexOf(moveid2));
						if (moves.size + movePool.length <= this.maxMoveCount) return;
					}
				}
			}
			if (moveArrayA.includes(moveid1)) {
				for (const moveid2 of moveArrayB) {
					if (moveid1 !== moveid2 && movePool.includes(moveid2)) {
						this.fastPopSafe(movePool, movePool.indexOf(moveid2));
						if (moves.size + movePool.length <= this.maxMoveCount) return;
					}
				}
			}
		}
	}

	addFusionMove(
		move: string,
		moves: Set<string>,
		types: Set<string>,
		abilities: string[],
		teamDetails: RandomTeamsTypes.TeamDetails,
		species: Species,
		species2: Species,
		isLead: boolean,
		movePool: string[],
		teraType: string,
		role: RandomTeamsTypes.Role,
		isDoubles = false,
	): MoveCounter {
		moves.add(move);
		this.fastPopSafe(movePool, movePool.indexOf(move));
		const counter = this.queryMoves(moves, species, teraType, abilities);
		this.cullFusionMovePool(
			types,
			moves,
			abilities,
			counter,
			movePool,
			teamDetails,
			species,
			species2,
			isLead,
			teraType,
			role,
			isDoubles,
		);
		return counter;
	}

	randomFusionMoveset(
		types: Set<string>,
		abilities: string[],
		teamDetails: RandomTeamsTypes.TeamDetails,
		species: Species,
		species2: Species,
		isLead: boolean,
		movePool: string[],
		teraType: string,
		role: RandomTeamsTypes.Role,
		isDoubles: boolean,
	): Set<string> {
		const moves = new Set<string>();
		let counter = this.queryMoves(moves, species, teraType, abilities);
		this.cullFusionMovePool(
			types,
			moves,
			abilities,
			counter,
			movePool,
			teamDetails,
			species,
			species2,
			isLead,
			teraType,
			role,
			isDoubles,
		);

		// If there are only four moves, add all moves and return early
		if (movePool.length <= this.maxMoveCount) {
			for (const moveid of movePool) {
				moves.add(moveid);
			}
			return moves;
		}

		const runEnforcementChecker = (checkerName: string) => {
			if (!this.moveEnforcementCheckers[checkerName]) return false;
			return this.moveEnforcementCheckers[checkerName](
				movePool,
				moves,
				abilities,
				types,
				counter,
				species,
				teamDetails,
				isLead,
				isDoubles,
				teraType,
				role,
			);
		};

		if (role === "Tera Blast user") {
			counter = this.addFusionMove(
				"terablast",
				moves,
				types,
				abilities,
				teamDetails,
				species,
				species2,
				isLead,
				movePool,
				teraType,
				role,
				isDoubles,
			);
		}
		// Add required move (e.g. Relic Song for Meloetta-P)
		if (species.requiredMove) {
			const move = this.dex.moves.get(species.requiredMove).id;
			counter = this.addFusionMove(
				move,
				moves,
				types,
				abilities,
				teamDetails,
				species,
				species2,
				isLead,
				movePool,
				teraType,
				role,
				isDoubles,
			);
		}

		// Add other moves you really want to have, e.g. STAB, recovery, setup.
		// Enforce setup
		if (role.includes("Setup") || role === "Tera Blast user") {
			// First, try to add a non-Speed setup move
			const nonSpeedSetupMoves = movePool.filter(
				(moveid) => SETUP.includes(moveid) && !SPEED_SETUP.includes(moveid),
			);
			if (nonSpeedSetupMoves.length) {
				const moveid = this.sample(nonSpeedSetupMoves);
				counter = this.addFusionMove(
					moveid,
					moves,
					types,
					abilities,
					teamDetails,
					species,
					species2,
					isLead,
					movePool,
					teraType,
					role,
					isDoubles,
				);
			} else {
				// No non-Speed setup moves, so add any (Speed) setup move
				const setupMoves = movePool.filter((moveid) =>
					SETUP.includes(moveid),
				);
				if (setupMoves.length) {
					const moveid = this.sample(setupMoves);
					counter = this.addFusionMove(
						moveid,
						moves,
						types,
						abilities,
						teamDetails,
						species,
						species2,
						isLead,
						movePool,
						teraType,
						role,
						isDoubles,
					);
				}
			}
		}
		// Enforce Facade if Guts is a possible ability
		if (
			movePool.includes("facade") &&
			abilities.includes("Guts") &&
			this.prng.random() > 0.5
		) {
			counter = this.addFusionMove(
				"facade",
				moves,
				types,
				abilities,
				teamDetails,
				species,
				species2,
				isLead,
				movePool,
				teraType,
				role,
				isDoubles,
			);
		}

		// Enforce Night Shade, Revelation Dance, Revival Blessing, and Sticky Web
		for (const moveid of [
			"revelationdance",
			"revivalblessing",
			"stickyweb",
		]) {
			if (movePool.includes(moveid)) {
				counter = this.addFusionMove(
					moveid,
					moves,
					types,
					abilities,
					teamDetails,
					species,
					species2,
					isLead,
					movePool,
					teraType,
					role,
					isDoubles,
				);
			}
		}

		// Enforce Trick Room on Doubles Wallbreaker
		if (movePool.includes("trickroom") && role === "Doubles Wallbreaker") {
			counter = this.addFusionMove(
				"trickroom",
				moves,
				types,
				abilities,
				teamDetails,
				species,
				species2,
				isLead,
				movePool,
				teraType,
				role,
				isDoubles,
			);
		}

		// Enforce hazard removal on Bulky Support if the team doesn't already have it
		if (
			role === "Bulky Support" &&
			!teamDetails.defog &&
			!teamDetails.rapidSpin
		) {
			if (movePool.includes("rapidspin")) {
				counter = this.addFusionMove(
					"rapidspin",
					moves,
					types,
					abilities,
					teamDetails,
					species,
					species2,
					isLead,
					movePool,
					teraType,
					role,
					isDoubles,
				);
			}
			if (movePool.includes("defog")) {
				counter = this.addFusionMove(
					"defog",
					moves,
					types,
					abilities,
					teamDetails,
					species,
					species2,
					isLead,
					movePool,
					teraType,
					role,
					isDoubles,
				);
			}
		}

		// Enforce Aurora Veil if the team doesn't already have screens
		if (
			!teamDetails.screens &&
			movePool.includes("auroraveil") &&
			(teamDetails.snow ||
				teamDetails.hail ||
				abilities.includes("Snow Warning"))
		) {
			counter = this.addFusionMove(
				"auroraveil",
				moves,
				types,
				abilities,
				teamDetails,
				species,
				species2,
				isLead,
				movePool,
				teraType,
				role,
				isDoubles,
			);
		}

		// Enforce Knock Off on pure Normal- and Fighting-types in singles
		if (
			!isDoubles &&
			types.size === 1 &&
			(types.has("Normal") || types.has("Fighting"))
		) {
			if (movePool.includes("knockoff")) {
				counter = this.addFusionMove(
					"knockoff",
					moves,
					types,
					abilities,
					teamDetails,
					species,
					species2,
					isLead,
					movePool,
					teraType,
					role,
					isDoubles,
				);
			}
		}

		// Enforce Spore on Smeargle
		// if (species.id === 'smeargle') {
		// 	if (movePool.includes('spore')) {
		// 		counter = this.addFusionMove('spore', moves, types, abilities, teamDetails, species, isLead,
		// 			movePool, teraType, role, isDoubles);
		// 	}
		// }

		// Enforce moves in doubles
		if (isDoubles) {
			const doublesEnforcedMoves = ["mortalspin", "spore"];
			for (const moveid of doublesEnforcedMoves) {
				if (movePool.includes(moveid)) {
					counter = this.addFusionMove(
						moveid,
						moves,
						types,
						abilities,
						teamDetails,
						species,
						species2,
						isLead,
						movePool,
						teraType,
						role,
						isDoubles,
					);
				}
			}
			// Enforce Fake Out on slow Pokemon
			if (movePool.includes("fakeout") && species.baseStats.spe <= 50) {
				counter = this.addFusionMove(
					"fakeout",
					moves,
					types,
					abilities,
					teamDetails,
					species,
					species2,
					isLead,
					movePool,
					teraType,
					role,
					isDoubles,
				);
			}
			// Enforce Tailwind on Prankster and Gale Wings users
			if (
				movePool.includes("tailwind") &&
				(abilities.includes("Prankster") ||
					abilities.includes("Gale Wings"))
			) {
				counter = this.addFusionMove(
					"tailwind",
					moves,
					types,
					abilities,
					teamDetails,
					species,
					species2,
					isLead,
					movePool,
					teraType,
					role,
					isDoubles,
				);
			}
		}

		// Enforce STAB priority
		if (
			[
				"Bulky Attacker",
				"Bulky Setup",
				"Wallbreaker",
				"Doubles Wallbreaker",
			].includes(role) ||
			this.priorityPokemon.includes(species.id)
		) {
			const priorityMoves = [];
			for (const moveid of movePool) {
				const move = this.dex.moves.get(moveid);
				const moveType = this.getMoveType(
					move,
					species,
					abilities,
					teraType,
				);
				if (
					types.has(moveType) &&
					(move.priority > 0 ||
						(moveid === "grassyglide" &&
							abilities.includes("Grassy Surge"))) &&
					(move.basePower || move.basePowerCallback)
				) {
					priorityMoves.push(moveid);
				}
			}
			if (priorityMoves.length) {
				const moveid = this.sample(priorityMoves);
				counter = this.addFusionMove(
					moveid,
					moves,
					types,
					abilities,
					teamDetails,
					species,
					species2,
					isLead,
					movePool,
					teraType,
					role,
					isDoubles,
				);
			}
		}

		

		// Enforce STAB
		for (const type of types) {
			// Check if a STAB move of that type should be required
			const stabMoves = [];
			for (const moveid of movePool) {
				const move = this.dex.moves.get(moveid);
				const moveType = this.getMoveType(
					move,
					species,
					abilities,
					teraType,
				);
				if (
					!this.noStab.includes(moveid) &&
					(move.basePower || move.basePowerCallback) &&
					type === moveType
				) {
					stabMoves.push(moveid);
				}
			}
			while (runEnforcementChecker(type)) {
				if (!stabMoves.length) break;
				const moveid = this.sampleNoReplace(stabMoves);
				counter = this.addFusionMove(
					moveid,
					moves,
					types,
					abilities,
					teamDetails,
					species,
					species2,
					isLead,
					movePool,
					teraType,
					role,
					isDoubles,
				);
			}
		}

		// Enforce Tera STAB
		if (
			!counter.get("stabtera") &&
			!["Bulky Support", "Doubles Support"].includes(role)
		) {
			const stabMoves = [];
			for (const moveid of movePool) {
				const move = this.dex.moves.get(moveid);
				const moveType = this.getMoveType(
					move,
					species,
					abilities,
					teraType,
				);
				if (
					!this.noStab.includes(moveid) &&
					(move.basePower || move.basePowerCallback) &&
					teraType === moveType
				) {
					stabMoves.push(moveid);
				}
			}
			if (stabMoves.length) {
				const moveid = this.sample(stabMoves);
				counter = this.addFusionMove(
					moveid,
					moves,
					types,
					abilities,
					teamDetails,
					species,
					species2,
					isLead,
					movePool,
					teraType,
					role,
					isDoubles,
				);
			}
		}

		// If no STAB move was added, add a STAB move
		if (!counter.get("stab")) {
			const stabMoves = [];
			for (const moveid of movePool) {
				const move = this.dex.moves.get(moveid);
				const moveType = this.getMoveType(
					move,
					species,
					abilities,
					teraType,
				);
				if (
					!this.noStab.includes(moveid) &&
					(move.basePower || move.basePowerCallback) &&
					types.has(moveType)
				) {
					stabMoves.push(moveid);
				}
			}
			if (stabMoves.length) {
				const moveid = this.sample(stabMoves);
				counter = this.addFusionMove(
					moveid,
					moves,
					types,
					abilities,
					teamDetails,
					species,
					species2,
					isLead,
					movePool,
					teraType,
					role,
					isDoubles,
				);
			}
		}

		if(moves.has('storedpower') && !counter.get('setup')){
			const setupMoves = movePool.filter((moveid) =>
					SETUP.includes(moveid),
				);
			if (setupMoves.length) {
				const moveid = this.sample(setupMoves);
				counter = this.addFusionMove(
					moveid,
					moves,
					types,
					abilities,
					teamDetails,
					species,
					species2,
					isLead,
					movePool,
					teraType,
					role,
					isDoubles,
				);
			} else {
				moves.delete('storedpower')
			}
		}

		// Enforce recovery
		if (["Bulky Support", "Bulky Attacker", "Bulky Setup"].includes(role)) {
			const recoveryMoves = movePool.filter((moveid) =>
				RECOVERY_MOVES.includes(moveid),
			);
			if (recoveryMoves.length) {
				const moveid = this.sample(recoveryMoves);
				counter = this.addFusionMove(
					moveid,
					moves,
					types,
					abilities,
					teamDetails,
					species,
					species2,
					isLead,
					movePool,
					teraType,
					role,
					isDoubles,
				);
			}
		}

		// Enforce pivoting moves on AV Pivot
		if (role === "AV Pivot") {
			const pivotMoves = movePool.filter((moveid) =>
				["uturn", "voltswitch"].includes(moveid),
			);
			if (pivotMoves.length) {
				const moveid = this.sample(pivotMoves);
				counter = this.addFusionMove(
					moveid,
					moves,
					types,
					abilities,
					teamDetails,
					species,
					species2,
					isLead,
					movePool,
					teraType,
					role,
					isDoubles,
				);
			}
		}

		
		
		// Enforce redirecting moves and Fake Out on Doubles Support
		if (role === "Doubles Support") {
			for (const moveid of ["fakeout", "followme", "ragepowder"]) {
				if (movePool.includes(moveid)) {
					counter = this.addFusionMove(
						moveid,
						moves,
						types,
						abilities,
						teamDetails,
						species,
						species2,
						isLead,
						movePool,
						teraType,
						role,
						isDoubles,
					);
				}
			}
			const speedControl = movePool.filter((moveid) =>
				SPEED_CONTROL.includes(moveid),
			);
			if (speedControl.length) {
				const moveid = this.sample(speedControl);
				counter = this.addFusionMove(
					moveid,
					moves,
					types,
					abilities,
					teamDetails,
					species,
					species2,
					isLead,
					movePool,
					teraType,
					role,
					isDoubles,
				);
			}
		}

		// Enforce Protect
		if (role.includes("Protect")) {
			const protectMoves = movePool.filter((moveid) =>
				PROTECT_MOVES.includes(moveid),
			);
			if (protectMoves.length) {
				const moveid = this.sample(protectMoves);
				counter = this.addFusionMove(
					moveid,
					moves,
					types,
					abilities,
					teamDetails,
					species,
					species2,
					isLead,
					movePool,
					teraType,
					role,
					isDoubles,
				);
			}
		}

		// Enforce a move not on the noSTAB list
		if (!counter.damagingMoves.size) {
			// Choose an attacking move
			const attackingMoves = [];
			for (const moveid of movePool) {
				const move = this.dex.moves.get(moveid);
				if (
					(!this.noStab.includes(moveid) &&
					move.category !== "Status") ||
					(!this.noStab.includes(moveid) && move.category !== "Status" && move.type != "Normal" && !abilities.includes('Galvanize') && !abilities.includes('Pixilate') && !abilities.includes('Aerilate'))
				)
					attackingMoves.push(moveid);
			}
			if (attackingMoves.length) {
				const moveid = this.sample(attackingMoves);
				counter = this.addFusionMove(
					moveid,
					moves,
					types,
					abilities,
					teamDetails,
					species,
					species2,
					isLead,
					movePool,
					teraType,
					role,
					isDoubles,
				);
			}
		}

		// Enforce coverage move
		if (
			![
				"AV Pivot",
				"Fast Support",
				"Bulky Support",
				"Bulky Protect",
				"Doubles Support",
			].includes(role)
		) {
			if (counter.damagingMoves.size === 1) {
				// Find the type of the current attacking move
				const currentAttackType = counter.damagingMoves.values().next()
					.value!.type;
				// Choose an attacking move that is of different type to the current single attack
				const coverageMoves = [];
				for (const moveid of movePool) {
					const move = this.dex.moves.get(moveid);
					const moveType = this.getMoveType(
						move,
						species,
						abilities,
						teraType,
					);
					if (
						!this.noStab.includes(moveid) &&
						(move.basePower || move.basePowerCallback)
					) {
						if (currentAttackType !== moveType)
							coverageMoves.push(moveid);
					}
				}
				if (coverageMoves.length) {
					const moveid = this.sample(coverageMoves);
					counter = this.addFusionMove(
						moveid,
						moves,
						types,
						abilities,
						teamDetails,
						species,
						species2,
						isLead,
						movePool,
						teraType,
						role,
						isDoubles,
					);
				}
			}
		}

		const NEW_MOVE_PAIRS = this.getMovePairs(abilities);
		// Add (moves.size < this.maxMoveCount) as a condition if moves is getting larger than 4 moves.
		// If you want moves to be favored but not required, add something like && this.randomChance(1, 2) to your condition.

		// Choose remaining moves randomly from movepool and add them to moves list:
		while (moves.size < this.maxMoveCount && movePool.length) {
			if (moves.size + movePool.length <= this.maxMoveCount) {
				for (const moveid of movePool) {
					moves.add(moveid);
				}
				break;
			}
			const moveid = this.sample(movePool);

			counter = this.addFusionMove(
				moveid,
				moves,
				types,
				abilities,
				teamDetails,
				species,
				species2,
				isLead,
				movePool,
				teraType,
				role,
				isDoubles,
			);
			if (moves.size >= this.maxMoveCount) {
				break;
			}
			for (const pair of NEW_MOVE_PAIRS) {
				if (moveid === pair[0] && movePool.includes(pair[1])) {
					counter = this.addFusionMove(
						pair[1],
						moves,
						types,
						abilities,
						teamDetails,
						species,
						species2,
						isLead,
						movePool,
						teraType,
						role,
						isDoubles,
					);
				}
				if (moves.size >= this.maxMoveCount) {
					break;
				}
				if (moveid === pair[1] && movePool.includes(pair[0])) {
					counter = this.addFusionMove(
						pair[0],
						moves,
						types,
						abilities,
						teamDetails,
						species,
						species2,
						isLead,
						movePool,
						teraType,
						role,
						isDoubles,
					);
				}
				if (moves.size >= this.maxMoveCount) {
					break;
				}
			}
		}
		return moves;
	}

	getFusionPriorityItem(
		ability: string,
		types: Set<string>,
		moves: Set<string>,
		counter: MoveCounter,
		teamDetails: RandomTeamsTypes.TeamDetails,
		species: Species,
		species2: Species,
		isLead: boolean,
		teraType: string,
		role: RandomTeamsTypes.Role,
		isDoubles: boolean,
	) {
		if (!isDoubles) {
			if (
				role === "Fast Bulky Setup" &&
				(ability === "Quark Drive" || ability === "Protosynthesis")
			) {
				return "Booster Energy";
			}
			if (species.id === "lokix" && ability === "Tinted Lens") {
				return role === "Fast Attacker" ? "Silver Powder" : "Life Orb";
			}
		}

		if (species.requiredItems) {
			// Z-Crystals aren't available in Gen 9, so require Plates
			if (species.baseSpecies === "Arceus") {
				return species.requiredItems[0];
			}
			return this.sample(species.requiredItems);
		}

		if (species2.requiredItems) {
			if (species2.baseSpecies === "Arceus") {
				return species2.requiredItems[0];
			}
			return this.sample(species2.requiredItems);
		}

		if (role === "AV Pivot") return "Assault Vest";

		if (
			types.has("Normal") &&
			moves.has("doubleedge") &&
			moves.has("fakeout")
		)
			return "Silk Scarf";
		if (
			species.id === "froslass" ||
			moves.has("populationbomb") ||
			(ability === "Hustle" &&
				counter.get("setup") &&
				!isDoubles &&
				this.randomChance(1, 2))
		)
			return "Wide Lens";

		if (
			moves.has("clangoroussoul") ||
			(ability === "Punk Rock" &&
				moves.intersection(new Set(SPEED_SETUP)).size)
		)
			return "Throat Spray";
		if (
			(types.has("steel") &&
				types.has("fairy") &&
				role === "Tera Blast user") ||
			((species2.id === "calyrexice" ||
				species.id === "calyrexice" ||
				ability === "Prism Armor") &&
				isDoubles)
		)
			return "Weakness Policy";
		if (
			["dragonenergy", "lastrespects", "waterspout"].some((m) =>
				moves.has(m),
			)
		)
			return "Choice Scarf";
		if (
			!isDoubles &&
			(ability === "Imposter" ||
				((species.id === "magnezone" || species2.id === "magnezone") &&
					role === "Fast Attacker"))
		)
			return "Choice Scarf";
		if (
			(species.id === "rampardos" || species2.id === "rampardos") &&
			(role === "Fast Attacker" || isDoubles)
		)
			return "Choice Scarf";
		if (
			(species.id === "palkia" || species2.id === "palkia") &&
			counter.get("Status")
		)
			return "Lustrous Orb";
		if (
			moves.has("courtchange") ||
			(!isDoubles &&
				(species.id === "luvdisc" ||
					species2.id === "luvdisc" ||
					((species.id === "terapagos" || species2.id === "terapagos") &&
						!moves.has("rest"))))
		)
			return "Heavy-Duty Boots";
		if (
			["Cheek Pouch", "Cud Chew", "Harvest", "Ripen"].some(
				(m) => ability === m,
			) ||
			moves.has("bellydrum") ||
			moves.has("filletaway")
		) {
			return "Sitrus Berry";
		}
		if (["healingwish", "switcheroo", "trick"].some((m) => moves.has(m))) {
			if (
				species.baseStats.spe >= 60 &&
				species.baseStats.spe <= 108 &&
				role !== "Wallbreaker" &&
				role !== "Doubles Wallbreaker" &&
				!counter.get("priority")
			) {
				return "Choice Scarf";
			} else {
				return counter.get("Physical") > counter.get("Special")
					? "Choice Band"
					: "Choice Specs";
			}
		}
		if (
			counter.get("Status") &&
			(species.name === "Latias" || species.name === "Latios")
		)
			return "Soul Dew";
		if (species.id === "scyther" && !isDoubles)
			return isLead && !moves.has("uturn") ? "Eviolite" : "Heavy-Duty Boots";
		if (ability === "Poison Heal" || ability === "Quick Feet")
			return "Toxic Orb";
		if (species.nfe && species2.nfe) return "Eviolite";
		if (
			(ability === "Guts" || ability === "Toxic Boost") &&
			!moves.has("sleeptalk") &&
			counter.get("Physical") > counter.get("Special")
		) {
			return types.has("Fire") ? "Toxic Orb" : "Flame Orb";
		}
		if (
			ability === "Magic Guard" ||
			(ability === "Sheer Force" && counter.get("sheerforce"))
		)
			return "Life Orb";
		if (ability === "Anger Shell")
			return this.sample([
				"Expert Belt",
				"Lum Berry",
				"Scope Lens",
				"Sitrus Berry",
			]);
		if (moves.has("dragondance") && isDoubles) return "Clear Amulet";
		if (
			counter.get("skilllink") &&
			ability !== "Skill Link" &&
			species.id !== "breloom" &&
			species2.id !== "breloom"
		)
			return "Loaded Dice";
		if (ability === "Unburden") {
			return moves.has("closecombat") || moves.has("leafstorm")
				? "White Herb"
				: "Sitrus Berry";
		}
		if (moves.has("shellsmash") && ability !== "Weak Armor")
			return "White Herb";
		if (
			moves.has("meteorbeam") ||
			(moves.has("electroshot") && !teamDetails.rain)
		)
			return "Power Herb";
		if (moves.has("acrobatics") && ability !== "Protosynthesis") return "";
		if (
			moves.has("auroraveil") ||
			(moves.has("lightscreen") && moves.has("reflect"))
		)
			return "Light Clay";
		if (ability === "Gluttony")
			return `${this.sample(["Aguav", "Figy", "Iapapa", "Mago", "Wiki"])} Berry`;
		if (
			species.id === "giratina" &&
			!isDoubles &&
			moves.has("rest") &&
			!moves.has("sleeptalk")
		)
			return "Leftovers";
		if (
			moves.has("rest") &&
			!moves.has("sleeptalk") &&
			ability !== "Natural Cure" &&
			ability !== "Shed Skin"
		) {
			return "Chesto Berry";
		}
		if (
			species.id !== "yanmega" &&
			this.dex.getEffectiveness("Rock", species) >= 2 &&
			(!types.has("Flying") || !isDoubles)
		)
			return "Heavy-Duty Boots";
	}
	isStatIndependentAttack(move:Move) {
		if (move.category === 'Status') return false;
		return (
			STAT_INDEPENDENT_MOVES.has(move.id) ||
			move.damage !== undefined ||                  // damage: 40 / 'level'
			typeof move.damageCallback === 'function' ||   // Super Fang, Endeavor, Ruination...
			!!move.ohko ||
			move.overrideOffensivePokemon === 'target' ||  // Foul Play
			move.overrideOffensiveStat === 'def' ||        // Body Press
			move.overrideOffensiveStat === 'spd'
		);
	}

	shouldCullFusionAbility(
			ability: string,
			types: Set<string>,
			moves: Set<string>,
			abilities: string[],
			counter: MoveCounter,
			teamDetails: RandomTeamsTypes.TeamDetails,
			species: Species,
			species2: Species,
			role: RandomTeamsTypes.Role,
			isLead: boolean,
			isDoubles: boolean,
		): boolean {
			switch (ability) {
			// Abilities which are primarily useful for certain moves or with team support
			case 'Chlorophyll': case 'Solar Power':
				return !teamDetails.sun;
			case 'Defiant':
				return (species.id === 'thundurus' && !!counter.get('Status'));
			case 'Hydration': case 'Swift Swim':
				return !teamDetails.rain;
			case 'Iron Fist': case 'Skill Link':
				return !counter.get(toID(ability));
			case 'Overgrow':
				return !counter.get('Grass');
			case 'Prankster':
				return !counter.get('Status');
			case 'Sand Force': case 'Sand Rush':
				return !teamDetails.sand;
			case 'Slush Rush':
				return !teamDetails.snow;
			case 'Swarm':
				return !counter.get('Bug');
			case 'Torrent':
				return (!counter.get('Water') && !moves.has('flipturn'));
			case 'Multitype':
				return species.baseSpecies !== 'Arceus' && species2.baseSpecies !== 'Arceus';
			case 'RKS System':
				return species.baseSpecies !== 'Silvally' && species2.baseSpecies !== 'Silvally';
			case 'Huge Power':
			case 'Pure Power':
			case 'Guts':
			case 'Toxic Boost':
				return !counter.get('physical');
			case 'Hunger Switch':
				return species.baseSpecies != 'Morpeko'
			case 'Shields Down':
				return species.baseSpecies != 'Minior'
			case 'Disguise':
				return species.baseSpecies != 'Mimikyu'
			case 'Gulp Missile':
				return species.baseSpecies != 'Cramorant' || !moves.has('Surf')
			case 'Zero to Hero':
				return species.baseSpecies != 'Palafin'
			case 'Ice Face':
				return species.baseSpecies != 'Eiscue'
			case 'Mega Launcher':
				return !counter.get('pulse');
			}
	
			return false;
		}
	override queryMoves(
			moves: Set<string> | null,
			species: Species,
			teraType: string,
			abilities: string[],
		): MoveCounter {
			// This is primarily a helper function for random setbuilder functions.
			const counter = new MoveCounter();
			const types = new Set(species.types);
			if (!moves?.size) return counter;
	
			const categories = { Physical: 0, Special: 0, Status: 0 };
	
			// Iterate through all moves we've chosen so far and keep track of what they do:
			for (const moveid of moves) {
				let move = this.dex.moves.get(moveid);
				// Nature Power calls Earthquake in Gen 5 and Tri Attack in Gens 6-9
				if (this.gen === 5 && moveid === 'naturepower') move = this.dex.moves.get('earthquake');
				if (this.gen > 5 && moveid === 'naturepower') move = this.dex.moves.get('triattack');
	
				const moveType = this.getMoveType(move, species, abilities, teraType);
				if (move.damage || move.damageCallback) {
					// Moves that do a set amount of damage:
					counter.add('damage');
					counter.damagingMoves.add(move);
				} else {
					// Are Physical/Special/Status moves:
					categories[move.category]++;
				}
				// Moves that have a low base power:
				if (moveid === 'lowkick' || (move.basePower && move.basePower <= 60 && !['nuzzle', 'rapidspin'].includes(moveid))) {
					counter.add('technician');
				}
				// Moves that hit up to 5 times:
				if (move.multihit && Array.isArray(move.multihit) && move.multihit[1] === 5) counter.add('skilllink');
				if (move.recoil || move.hasCrashDamage) counter.add('recoil');
				if (move.drain) counter.add('drain');
				if (move.flags.pulse) counter.add('pulse');
				// Moves which have a base power:
				if (move.basePower || move.basePowerCallback) {
					counter.basePowerMoves.add(move);
					if (!this.noStab.includes(moveid) || this.priorityPokemon.includes(species.id) && move.priority > 0) {
						counter.add(moveType);
						if (types.has(moveType)) counter.add('stab');
						if (teraType === moveType) counter.add('stabtera');
						counter.damagingMoves.add(move);
					}
					if (move.flags['bite']) counter.add('strongjaw');
					if (move.flags['punch']) counter.add('ironfist');
					if (move.flags['sound']) counter.add('sound');
					if (move.priority > 0 || (moveid === 'grassyglide' && abilities.includes('Grassy Surge'))) {
						counter.add('priority');
					}
				}
				// Moves with secondary effects:
				if (move.secondary || move.hasSheerForceBoost) {
					counter.add('sheerforce');
				}
				// Moves with low accuracy:
				if (move.accuracy && move.accuracy !== true && move.accuracy < 90) counter.add('inaccurate');
	
				// Moves that change stats:
				if (RECOVERY_MOVES.includes(moveid)) counter.add('recovery');
				if (CONTRARY_MOVES.includes(moveid)) counter.add('contrary');
				if (PHYSICAL_SETUP.includes(moveid)) counter.add('physicalsetup');
				if (SPECIAL_SETUP.includes(moveid)) counter.add('specialsetup');
				if (MIXED_SETUP.includes(moveid)) counter.add('mixedsetup');
				if (SPEED_SETUP.includes(moveid)) counter.add('speedsetup');
				if (SPEED_CONTROL.includes(moveid)) counter.add('speedcontrol');
				if (SETUP.includes(moveid)) counter.add('setup');
				if (HAZARDS.includes(moveid)) counter.add('hazards');
			}
	
			counter.set('Physical', Math.floor(categories['Physical']));
			counter.set('Special', Math.floor(categories['Special']));
			counter.set('Status', categories['Status']);
			return counter;
		}
}
