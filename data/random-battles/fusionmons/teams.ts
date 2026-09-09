import { PRNG } from "../../../sim/prng";
import { FusionScript } from "../../mods/fusionmons/fusion";
import RandomTeams from "../gen9/teams";

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
	}
	shuffleSets(
		set: RandomTeamsTypes.RandomSet,
		set2: RandomTeamsTypes.RandomSet,
	) {
		set.ability = this.random() > 0.5 ? set.ability : set2.ability;
		for (let i in set.moves) {
			set.moves[i] = this.random() > 0.5 ? set.moves[i] : set2.moves[i];
		}
		set.item = this.random() > 0.5 ? set.item : set2.item;
		set.name = `+${set2.species}`;
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
			const baseSpecies2 = this.sampleNoReplace(baseSpeciesPool);
			let species = this.dex.species.get(
				this.sample(pokemonPool[baseSpecies]),
			);
			let species2 = this.dex.species.get(
				this.sample(pokemonPool[baseSpecies2]),
			);
			if (!species.exists || !species2.exists) continue;

			// Limit to one of each species (Species Clause)
			if (
				baseFormes[species.baseSpecies] ||
				baseFormes[species2.baseSpecies]
			)
				continue;

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
					set = this.randomSet(species, teamDetails, false, isDoubles);
					set2 = this.randomSet(species2, teamDetails, false, isDoubles);

					this.shuffleSets(set, set2);
					pokemon.push(set);
				} else {
					set = this.randomSet(species, teamDetails, true, isDoubles);
					set2 = this.randomSet(species2, teamDetails, true, isDoubles);
					this.shuffleSets(set, set2);
					pokemon.unshift(set);

					leadsRemaining--;
				}
			} else {
				set = this.randomSet(species, teamDetails, false, isDoubles);
				set2 = this.randomSet(species2, teamDetails, false, isDoubles);
				this.shuffleSets(set, set2);
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
				["ogerpon", "ogerponhearthflame", "terapagos"].includes(species.id)||["ogerpon", "ogerponhearthflame", "terapagos"].includes(species2.id)
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
}
