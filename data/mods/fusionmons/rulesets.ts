import { ModdedFormatDataTable } from "../../../sim/dex-formats";
import { FusionScript } from "./fusion";

/**@type {{[k: string]: ModdedFormatsData}} */

export const Rulesets: ModdedFormatDataTable = {
	fusionlearnsets: {
		effectType: "ValidatorRule",
		name: "fusionlearnsets",
		ruleset: ["EV Limit = 510", "Obtainable Misc", "Max Level = 100"],
		onValidateSet(set, _format, setHas, _teamHas) {
			const species = this.dex.species.get(
				this.dex.species.get(set.species).baseSpecies,
			);
			const species2 = FusionScript.parseName(set.name);
			if (
				species.natDexTier == "Illegal" ||
				(species2.natDexTier == "Illegal" && species2.exists)
			) {
				return [
					`${species.name}+${species2.name} is Illegal in National Dex`,
				];
			}
			// Any item that was legal in Gen 7 (Normal Gem for example) should be usable
			let item = this.dex.items.get(set.item);
			if (!!species2.battleOnly) {
				let baseSpecies;
				if (Array.isArray(species2.battleOnly)) {
					baseSpecies = species2.battleOnly.join(" or ");
				} else baseSpecies = species2.battleOnly;
				return [`Use ${baseSpecies} instead of ${species2.name}`];
			}

			if (species2.isMega) {
				return [`${species2.name} can't be used to fuse`];
			}

			if (
				species2.requiredItems &&
				!species2.requiredItems.includes(item.name)
			) {
				return [
					`${species2.name} requires on these items: ${species2.requiredItems.join(", ")}`,
				];
			}

			if (
				species2.requiredItems &&
				species2.requiredItems.includes(item.name)
			) {
				if (
					species2.baseSpecies == "Arceus" &&
					toID(set.ability) != "multitype"
				) {
					return [`${species2.name} requires ability "Multitype"`];
				} else if (
					species2.baseSpecies == "Silvally" &&
					toID(set.ability) != "rkssystem"
				) {
					return [`${species2.name} requires ability "RKS System"`];
				}
			}
			if (
				species2.requiredMove &&
				!set.moves.map(toID).includes(toID(species2.requiredMove))
			) {
				return [
					`${species2.name} requires this move: ${species2.requiredMove}`,
				];
			}

			let gen = this.dex.gen;
			while (item.isNonstandard && gen >= 7) {
				item = this.dex.forGen(gen).items.get(item.id);
				gen--;
			}

			const { outOfBattleSpecies, tierSpecies } =
				this.getValidationSpecies(set);

			const setSources = this.allSources(species);

			let moveLegalityWhitelist: { [k: string]: true } = {};
			let fusedLearnset = FusionScript.fuseLearnsets(species, species2);
			for (let m of fusedLearnset) {
				moveLegalityWhitelist[m] = true;
			}
			let problems: string[] = this.validateMoves(
				outOfBattleSpecies,
				set.moves,
				setSources,
				set,
				species.name,
				moveLegalityWhitelist,
			);
			console.log(moveLegalityWhitelist);
			problems.push(...this.validateStats(set, species, setSources, null));

			const ability = this.dex.abilities.get(set.ability);

			if (!set.ability) set.ability = "No Ability";

			if (this.dex.gen <= 2 || this.dex.currentMod === "gen7letsgo") {
				set.ability = "No Ability";
			} else {
				if (!ability.name || ability.name === "No Ability") {
					problems.push(
						`${set.species + set.name} needs to have an ability.`,
					);
				} else if (
					!Object.values(species.abilities).includes(ability.name) &&
					!Object.values(species2.abilities).includes(ability.name)
				) {
					if (tierSpecies.abilities[0] === ability.name) {
						set.ability = species.abilities[0];
					} else {
						problems.push(
							`${set.species + set.name} can't have ${set.ability}.`,
						);
					}
				}
				if (
					ability.name === species.abilities["H"] ||
					ability.name === species2.abilities["H"]
				) {
					setSources.isHidden = true;

					let unreleasedHidden = species.unreleasedHidden;
					if (
						unreleasedHidden === "Past" &&
						this.minSourceGen < this.dex.gen
					)
						unreleasedHidden = false;

					if (unreleasedHidden && this.ruleTable.has("-unreleased")) {
						problems.push(
							`${set.species + set.name}'s Hidden Ability is unreleased.`,
						);
					}
					if (species.maleOnlyHidden && species2.maleOnlyHidden) {
						if (set.gender && set.gender !== "M") {
							problems.push(
								`${set.species + set.name} must be male to have a Hidden Ability.`,
							);
						}
						set.gender = "M";
						setSources.sources = ["5D"];
					}
				} else {
					setSources.isHidden = false;
				}
			}

			const checkFirst = this.checkAbility(set, ability, setHas);
			const checkSecond = this.checkAbility(
				{ ...set, species: species2.name },
				ability,
				setHas,
			);
			if (checkFirst?.length && checkSecond?.length) {
				problems = problems.concat(checkFirst, checkSecond);
			}
			return problems;
		},
		onBegin() {
			this.add("rule", "Species Clause: Limit one of each Pokémon");
		},
		onValidateTeam(team, _format) {
			const speciesTable = new Set<number>();
			for (const set of team) {
				const species = this.dex.species.get(set.species);
				const species2 = this.dex.species.get(set.name.substring(1));

				if (
					speciesTable.has(species.num) ||
					(species2.exists &&
						species2.num != species.num &&
						speciesTable.has(species2.num))
				) {
					return [
						`You are limited to one of each Pokémon by Species Clause.`,
						`(You have more than one ${species.baseSpecies})`,
					];
				}
				speciesTable.add(species.num);
				if (species2.exists && species2.num != species.num) {
					speciesTable.add(species2.num);
				}
			}
		},
	},
	fusion: {
		effectType: "Rule",
		name: "Fusion",
		onSwitchIn: function (pokemon) {
			if (pokemon.terastallized) {
				return;
			}

			if (pokemon.name) {
				let name = pokemon.name.substring(1, 20);
				let template = this.dex.species.get(pokemon.species.baseSpecies);
				let template2 = this.dex.species.get(pokemon.name.substring(1));
				if (!template2.exists) {
					name = pokemon.species.name;
					template2 = pokemon.baseSpecies;
				}
				if (!template.exists) {
					template = pokemon.baseSpecies;
				}
				let new_types;

				new_types = [template.types[0], template.types[1]];
				if (
					this.dex.species.get(template2.baseSpecies).types !=
						pokemon.types &&
					!pokemon.transformed
				) {
					if (template2.types[1] != undefined)
						new_types = [template.types[0], template2.types[1]];
					else new_types = [template.types[0], template2.types[0]];
				}
				if (new_types[0] == new_types[1]) new_types.pop();
				new_types = new_types.filter((t) => t !== undefined);
				if (new_types.length === 0)
					new_types = [template.types[0] || "Normal"];
				pokemon.setType(new_types.filter(Boolean), true);

				//Zoroark Illusion
				let apparentPokemon;
				let apparentPokemon2;
				let apparentTypes = [] as string[];

				for (let i in new_types) {
					apparentTypes.push(new_types[i]);
				}

				if (pokemon.illusion) {
					let i;
					for (
						i = pokemon.side.pokemon.length - 1;
						i > pokemon.position;
						i--
					) {
						if (!pokemon.side.pokemon[i]) continue;
						if (!pokemon.side.pokemon[i].fainted) break;
					}
					if (
						pokemon.side.pokemon[i] &&
						pokemon != pokemon.side.pokemon[i]
					) {
						apparentPokemon = this.dex.species.get(
							pokemon.side.pokemon[i].species.id,
						);
						apparentPokemon2 = this.dex.species.get(
							pokemon.illusion.name.substring(1),
						);

						if (apparentPokemon2.types[1]) {
							apparentTypes = [
								apparentPokemon.types[0],
								apparentPokemon2.types[1],
							];
						} else {
							apparentTypes = [
								apparentPokemon.types[0],
								apparentPokemon2.types[0],
							];
						}

						if (apparentTypes[0] === apparentTypes[1])
							apparentTypes.pop();

						if (!apparentPokemon2.exists) {
							name = pokemon.illusion.species.baseSpecies;
							template2 = apparentPokemon;
						}
					} else {
						apparentPokemon = this.dex.species.get(pokemon.species);
						apparentPokemon2 = template2;
					}
				}
				FusionScript.info(
					pokemon,
					apparentPokemon2,
					apparentPokemon,
					apparentTypes,
				);
			}
		},
		onSwitchInPriority: 100,
	},
	teampreview: {
		effectType: "Rule",
		name: "Team Preview",
		onBegin: function () {
			this.add("clearpoke");
			let pokemonList = [[], []] as Pokemon[][];
			for (const pokemon of this.getAllPokemon()) {
				pokemonList[pokemon.side.n].push(pokemon);
				let details = pokemon.details
					.replace(
						/(Arceus|Gourgeist|Genesect|Pumpkaboo|Silvally)(-[a-zA-Z?]+)?/g,
						"$1-*",
					)
					.replace(", shiny", "");
				this.add(
					"poke",
					pokemon.side.id,
					details,
					pokemon.item ? "item" : "",
				);
			}
			for (let p in pokemonList) {
				let pokemonNames = [];
				this.add(
					"html",
					`<font color=#18334e><b>${pokemonList[p][0].side.name + "'s team:"}</b></font>`,
				);
				for (let pok in pokemonList[p]) {
					if (
						pokemonList[p][pok].name &&
						this.dex.species.get(pokemonList[p][pok].name.substring(1))
							.exists
					)
						pokemonNames.push(
							pokemonList[p][pok].species +
								"+" +
								this.dex.species.get(
									pokemonList[p][pok].name.substring(1),
								).name,
						);
				}
				this.add(
					"html",
					`  <div style="padding: 0px 0px 0px 0px;margin-Bottom: 8px;margin-Left: 15px;margin-Top=0";fontSize=12><font color=#254d74>${pokemonNames.join(" / ")}</font></div>`,
				);
			}
		},
		onTeamPreview: function () {
			this.makeRequest("teampreview");
		},
	},
};
