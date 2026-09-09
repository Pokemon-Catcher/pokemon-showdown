import { ModdedConditionDataTable } from "../../../sim/dex-conditions";


export const Conditions:ModdedConditionDataTable = {
	arceus: {
		onSwitchInPriority: 101,
		onSwitchIn: function (pokemon: Pokemon) {
			let type = pokemon.types;
			if (pokemon.ability === "multitype") {
				type[0] = pokemon.getItem().onPlate ?? type[0];
			}
			pokemon.setType(type, true);
		},
	},
	silvally: {
		onSwitchInPriority: 101,
		onSwitchIn: function (pokemon: Pokemon) {
			let type = pokemon.types;
			if (pokemon.ability === "rkssystem") {
				type[0] = pokemon.getItem().onMemory ?? type[0];
			}
			pokemon.setType(type, true);
		},
	},
};
