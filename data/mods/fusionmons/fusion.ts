import { Pokemon, TeamValidator } from "../../../sim";
import { Species } from "../../../sim/dex-species";
import { Dex } from "../../../sim";

export const FusionScript = {
	fuse: function (template: Species, pokemon: Pokemon) {
		//Setup
		let name = pokemon.species.name;
		let template1 = Dex.species.get(template.name); //First Pokemon
		let template2 = Dex.species.get(template.name); //Second  Pokemon

		//Extract second pokemon from name of first pokemon
		if (pokemon.name) {
			name = pokemon.name.substring(1);
			template2 = Dex.species.get(name);
			if (!template2.exists) {
				name = pokemon.species.name;
				template2 = Dex.species.get(template.name);
			}
		}

		let item = Dex.items.get(pokemon.item);
		// Arceus and Sylvally formes checking
		if (template.num === 493) {
			template1 = Dex.species.get(
				item &&
					item.onPlate &&
					Dex.abilities.get(pokemon.ability).id == "multitype"
					? "Arceus-" + item.onPlate
					: "Arceus",
			);
		} else if (template.num === 773) {
			template1 = Dex.species.get(
				item &&
					item.onMemory &&
					Dex.abilities.get(pokemon.ability).id == "rkssystem"
					? "Silvally-" + item.onPlate
					: "Silvally",
			);
		}

		let stats = this.fuseStatsCalculate(template1, template2);
		let new_types = [template1.types[0], template1.types[1]]; //Used for new types

		//Calculating of new types
		if (
			template2.types[0] !== pokemon.types[0] &&
			template2.types[1] !== pokemon.types[1] &&
			!pokemon.transformed
		) {
			if (template2.types[1] !== undefined) {
				new_types = [template1.types[0], template2.types[1]];
			} else {
				new_types = [template1.types[0], template2.types[0]];
			}
		}

		//Delete second type if they're equal
		if (new_types[0] === new_types[1]) new_types.pop();

		let templateResult = template1; //Result template
		pokemon.removeVolatile("hybride");
		//Assigning stats, weight, types to result template
		if (
			template2.exists &&
			template2 != pokemon.species &&
			!pokemon.transformed
		) {
			let new_stats = pokemon.battle.spreadModify(stats, pokemon.set);
			templateResult = new Species({
				...template1,
				baseStats: stats,
				stats: new_stats,
				weightkg: (template1.weightkg + template2.weightkg) / 2,
				types: new_types,
			});
			pokemon.hp = new_stats["hp"] - (pokemon.maxhp - pokemon.hp);
			pokemon.maxhp = new_stats["hp"];
		}
		return templateResult;
	},
	info: function (
		pokemon: Pokemon,
		apparentPokemon2?: Species,
		apparentPokemon?: Species,
		apparentTypes?: string[],
	) {
		if (!apparentPokemon) {
			apparentPokemon = pokemon.species;
		}
		if (!apparentTypes) {
			apparentTypes = pokemon.types;
		}
		if (!apparentPokemon2) {
			apparentPokemon2 = pokemon.baseSpecies;
		}
		if (
			apparentPokemon2 &&
			apparentPokemon.name != apparentPokemon2.name &&
			!pokemon.transformed
		) {
			pokemon.battle.add(
				"-start",
				pokemon,
				"typechange",
				apparentTypes.join("/"),
				"[silent]",
			);
			if (!pokemon.transformed) {
				pokemon.battle.add(
					"html",
					`<b>${"" + apparentPokemon.name + " + " + Dex.species.get(apparentPokemon2.id).name + " base stats:"}</b>`,
				);
				if (apparentPokemon2.exists) {
					// if (apparentPokemon.num < 722 && apparentPokemon2.num < 722) {
					// 	let num1 = apparentPokemon.num;
					// 	let num2 = apparentPokemon2.num;
					// 	num1 +=
					// 		(num1 > 386 ? 4 : 0) +
					// 		(num1 > 668 ? 1 : 0) +
					// 		(num1 > 669 ? 4 : 0) +
					// 		(num1 > 670 ? 4 : 0) +
					// 		(num1 > 671 ? 4 : 0) +
					// 		(num1 > 678 ? 1 : 0) +
					// 		(num1 > 681 ? 1 : 0) +
					// 		(num1 > 709 ? 1 : 0) +
					// 		(num1 > 718 ? 2 : 0) +
					// 		(num1 > 719 ? 1 : 0) +
					// 		(num1 > 720 ? 1 : 0);
					// 	num2 +=
					// 		(num2 > 386 ? 4 : 0) +
					// 		(num2 > 668 ? 1 : 0) +
					// 		(num2 > 669 ? 4 : 0) +
					// 		(num2 > 670 ? 4 : 0) +
					// 		(num2 > 671 ? 4 : 0) +
					// 		(num2 > 678 ? 1 : 0) +
					// 		(num2 > 681 ? 1 : 0) +
					// 		(num2 > 709 ? 1 : 0) +
					// 		(num2 > 718 ? 2 : 0) +
					// 		(num2 > 719 ? 1 : 0) +
					// 		(num2 > 720 ? 1 : 0);
					// 	pokemon.battle.add(
					// 		"html",
					// 		`<details><summary>Спрайт</summary><p><img src="https://japeal.com/wordpress/wp-content/themes/total/PKM/upload2/${num1}X${num2}X0.png"></p></details>`,
					// 	);
					// }
					let baseStatsFusion = this.fuseStatsCalculate(
						apparentPokemon,
						apparentPokemon2,
					);
					let baseStatsFusionText = `<table><tr><b><th>HP</th><th>Attack</th><th>Defense</th><th>Sp.Attack</th><th>Sp.Defense</th><th>Speed</th></b></tr> <tr><td>${baseStatsFusion["hp"]}</td><td>${baseStatsFusion["atk"]}</td><td>${baseStatsFusion["def"]}</td><td>${baseStatsFusion["spa"]}</td><td>${baseStatsFusion["spd"]}</td><td>${baseStatsFusion["spe"]}</td></tr></table>`;
					let minPossibleSpeed = Math.floor(
						Math.floor(
							(Math.floor(2 * baseStatsFusion["spe"]) *
								pokemon.set.level) /
								100 +
								5,
						) * 0.9,
					);
					let maxPossibleSpeed = Math.floor(
						Math.floor(
							(Math.floor(
								2 * baseStatsFusion["spe"] + 31 + Math.floor(252 / 4),
							) *
								pokemon.set.level) /
								100 +
								5,
						) * 1.1,
					);
					pokemon.battle.add(
						"html",
						`<font size=0.95 color=#5c5c8a>${baseStatsFusionText}Possible speed: ${minPossibleSpeed}-${maxPossibleSpeed}</font>`,
					);
				}
			}
		}
	},
	afterMega: function (pokemon: Pokemon) {
		pokemon.removeVolatile("hybride");
		let name = pokemon.name.substring(1);
		let template = Dex.species.get(
			Dex.species.get(pokemon.name).otherFormes?.[0],
		);
		let template2 = Dex.species.get(pokemon.name.substring(1));
		if (!template2.exists) {
			name = pokemon.species.name;
			template2 = template;
		}
		let types = this.fuseTypes(template.types, template2.types);
		let stats = this.fuseStatsCalculate(pokemon.species, template2);
		let newSpecies: Species = {
			...pokemon.species,
			baseStats: stats,
		};
		pokemon.setSpecies(newSpecies);
		let newHp = Math.floor(
			(Math.floor(
				2 * pokemon.species.baseStats["hp"] +
					pokemon.set.ivs["hp"] +
					Math.floor(pokemon.set.evs["hp"] / 4) +
					100,
			) *
				pokemon.level) /
				100 +
				10,
		);
		pokemon.hp = newHp - (pokemon.maxhp - pokemon.hp);
		pokemon.maxhp = newHp;
		pokemon.types = types;
		this.info(pokemon, template2, undefined, types);
	},

	fuseStatsCalculate: function (
		template1: Species,
		template2: Species,
	): StatsTable {
		let stats = {} as StatsTable;
		let BST1 = 0;
		let BST2 = 0;
		for (let stat in template1.baseStats) {
			BST1 += template1.baseStats[stat as StatID];
			BST2 += template2.baseStats[stat as StatID];
		}
		for (let stat in template1.baseStats) {
			stats[stat as StatID] = Math.floor(
				Math.max(BST1, BST2) *
					((template1.baseStats[stat as StatID] / BST2 +
						template2.baseStats[stat as StatID] / BST1) /
						2),
			);
		}
		return stats;
	},

	fuseLearnsets: function (template1: Species, template2: Species) {
		let newLearnset = new Set<ID>();

		let template1Learnset = Dex.species.getMovePool(template1.id, true);
		let template2Learnset = Dex.species.getMovePool(template2.id, true);

		// for(let i in movedex){
		// 	let result = TeamValidator.get('fusionmons').checkLearnset(i, template1.species);
		// 	if(!result || result['type']!='invalid')
		// 		template1Learnset[i]=true;
		// 	result = TeamValidator.get('fusionmons').checkLearnset(i, template2.species);
		// 	if(!result || result['type']!='invalid')
		// 		template2Learnset[i]=true;
		// }

		if (template1.id == template2.id) return template1Learnset;

		let types = this.fuseTypes(template1.types, template2.types);
		for (let i of template1Learnset) {
			let move = Dex.moves.get(i);
			let factor1 =
				Dex.getEffectiveness(move.type, types[1] ? types[1] : types[0]) +
				Number(Dex.getImmunity(move.type, types[1] ? types[1] : types[0])) -
				1;

			let factor2 =
				Dex.getEffectiveness(types[1] ? types[1] : types[0], move.type) +
				Number(Dex.getImmunity(types[1] ? types[1] : types[0], move.type)) -
				1;

			let effectiveness = factor2 <= 0; // т.к. factor1 <= 0 уже проверяется снаружи
			if (
				(factor1 <= 0 && factor2 <= 0) || // ни ход не SE к добавленному типу, ни добавленный тип не SE к ходу
				types.includes(move.type) || // тип хода и так входит в итоговый фьюжн-тайпинг
				template2Learnset.has(i as ID) || // второй родитель тоже учит этот ход
				(template1.types[0] == types[0] && template1.types[1] == types[1]) // фьюжн сохранил тайпинг первого родителя целиком
			)
				//if types of fuse is the same as the pokemon1 types
				newLearnset.add(i as ID);
		}
		for (let i of template2Learnset) {
			let move = Dex.moves.get(i);

			let factor1 =
				Dex.getEffectiveness(move.type, types[1] ? types[1] : types[0]) +
				Number(Dex.getImmunity(move.type, types[1] ? types[1] : types[0])) -
				1;

			let factor2 =
				Dex.getEffectiveness(types[1] ? types[1] : types[0], move.type) +
				Number(Dex.getImmunity(types[1] ? types[1] : types[0], move.type)) -
				1;

			let effectiveness = factor2 <= 0; // т.к. factor1 <= 0 уже проверяется снаружи

			if (
				(factor1 <= 0 && factor2 <= 0) || // ни ход не SE к добавленному типу, ни добавленный тип не SE к ходу
				types.includes(move.type) || // тип хода и так входит в итоговый фьюжн-тайпинг
				template2Learnset.has(i as ID) || // второй родитель тоже учит этот ход
				(template1.types[0] == types[0] && template1.types[1] == types[1]) // фьюжн сохранил тайпинг первого родителя целиком
			)
				//if types of fuse is the same as the pokemon2 types
				newLearnset.add(i as ID);
		}
		console.log(newLearnset);
		return newLearnset;
	},

	fuseTypes: function (types1: string[], types2: string[]) {
		let types = [types1[0], types2[1] ? types2[1] : types2[0]];
		if (types[0] == types[1]) types.pop();
		return types;
	},
};
