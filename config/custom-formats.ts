import { FusionScript } from "../data/mods/fusionmons/fusion";
import { FormatList } from "../sim/dex-formats";

export const Formats: FormatList = [
	{
		section: "My Little Formats",
		column: 1,
	},
	{
		id: "fusionmons" as ID,
		name: "[Gen 9] Fusionmons Random Battle",
		desc: "Battle of random pokemon fusions",
		mod: "fusionmons",
		team: "random",
		column: 1,
		ruleset: [
			"fusionlearnsets",
			"Fusion",
			"Sleep Clause Mod",
			"HP Percentage Mod",
			"Cancel Mod",
		],
		onAfterMega: function (pokemon) {
			FusionScript.afterMega(pokemon);
		},
		onModifySpecies(species, target, _source, _effect) {
			if (!FusionScript.fuse) return;
			if (!species.isMega && target)
				return FusionScript.fuse(species, target);
		},
	},
	{
		name: "[Gen 9] National Dex Fusionmons AG",
		desc: "Battle of pokemon fusions",
		mod: "fusionmons",
		column: 1,
		ruleset: [
			"fusionlearnsets",
			"Fusion",
			"Sleep Clause Mod",
			"Species Clause",
			"Nickname Clause",
			"OHKO Clause",
			"Evasion Moves Clause",
			"Endless Battle Clause",
			"Exact HP Mod",
			"Cancel Mod",
			"Team Preview",
		],
		banlist: ["Shadow Tag", "Arena Trap", "CAP", "Gengarite", "Baton Pass"],
		onAfterMega: function (pokemon) {
			FusionScript.afterMega(pokemon);
		},
		onModifySpecies(species, target, _source, _effect) {
			if (!FusionScript.fuse) return;
			if (!species.isMega && target)
				return FusionScript.fuse(species, target);
		},
	},
	// {
	// 	name: "[Gen 9] Fusionmons Ubers",
	// 	desc: "Battle of pokemon fusions",
	// 	mod: "fusionmons",
	// 	column: 1,
	// 	ruleset: [
	// 		"fusionlearnsets",
	// 		"Fusion",
	// 		"Sleep Clause Mod",
	// 		"Species Clause",
	// 		"Nickname Clause",
	// 		"OHKO Clause",
	// 		"Evasion Moves Clause",
	// 		"Endless Battle Clause",
	// 		"Exact HP Mod",
	// 		"Cancel Mod",
	// 		"Team Preview",
	// 	],
	// 	banlist: ["CAP"],
	// 	onAfterMega: function (pokemon) {
	// 		FusionScript.afterMega(pokemon);
	// 	},
	// 	onModifySpecies(species, target, _source, _effect) {
	// 		if (!FusionScript.fuse) return;
	// 		if (!species.isMega && target)
	// 			return FusionScript.fuse(species, target);
	// 	},
	// },
	{
		name: "[Gen 9] National Dex Double Fusionmons AG",
		desc: "Battle of pokemon fusions",
		mod: "fusionmons",
		gameType: "doubles",
		column: 1,
		ruleset: [
			"fusionlearnsets",
			"Fusion",
			"Species Clause",
			"Nickname Clause",
			"OHKO Clause",
			"Evasion Moves Clause",
			"Endless Battle Clause",
			"Exact HP Mod",
			"Cancel Mod",
			"Team Preview",
		],
		banlist: [
			"CAP",
			"Gengarite",
			"Eevium Z",
			"Kangaskhanite",
			"Dark Void",
			"Gravity ++ Grass Whistle",
			"Gravity ++ Hypnosis",
			"Gravity ++ Lovely Kiss",
			"Gravity ++ Sing",
			"Gravity ++ Sleep Powder",
		],
		onAfterMega: function (pokemon) {
			FusionScript.afterMega(pokemon);
		},
		onModifySpecies(species, target, _source, _effect) {
			if (!FusionScript.fuse) return;
			if (!species.isMega && target)
				return FusionScript.fuse(species, target);
		},
	},
];
