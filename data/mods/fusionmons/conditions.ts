import { ModdedConditionDataTable } from "../../../sim/dex-conditions";


export const Conditions:ModdedConditionDataTable = {
	arceus: {
		name: 'Arceus',
		onTypePriority: 1,
		onType(types, pokemon) {
			if(pokemon.species.num !== 493) return types
			if (pokemon.transformed || pokemon.ability !== 'multitype' && this.gen >= 8) return types;
			let type: string | undefined = 'Normal';
			if (pokemon.ability === 'multitype') {
				type = pokemon.getItem().onPlate??'Normal';
			}
			if(types[0]){
				types[0] = type
			}
			return types;
		},
	},
	silvally: {
		name: 'Silvally',
		onTypePriority: 1,
		onType(types, pokemon) {
			if(pokemon.species.num !== 772) return types
			if (pokemon.transformed || pokemon.ability !== 'rkssystem' && this.gen >= 8) return types;
			let type: string | undefined = 'Normal';
			if (pokemon.ability === 'rkssystem') {
				type = pokemon.getItem().onMemory;
				if (!type) {
					type = 'Normal';
				}
			}
			if(types[0]){
				types[0] = type
			}
			return types;
		},
	},
};
