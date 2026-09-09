import { FusionScript } from "../../data/mods/fusionmons/fusion";

export const commands: Chat.ChatCommands = {
	fu: function (target, room, user, connection, cmd) {
		let buffer;
		let sep = target.split(",");
		if (sep.length >= 2) {
			let pokemon1 = Dex.species.get(sep[0]);
			let pokemon2 = Dex.species.get(sep[1]);
			if (pokemon1.exists && pokemon2.exists) {
				let baseStatsFusion = FusionScript.fuseStatsCalculate(
					pokemon1,
					pokemon2,
				);
				let pokTypes = FusionScript.fuseTypes(
					pokemon1.types,
					pokemon2.types,
				);
				let pokAbilities = Object.values(pokemon1.abilities).concat(
					Object.values(pokemon2.abilities),
				);
				let filteredAbilities = [];
				let table: { [key: string]: boolean } = {};
				for (let i in pokAbilities) {
					if (!table[pokAbilities[i]]) {
						table[pokAbilities[i]] = true;
						filteredAbilities.push(pokAbilities[i]);
					}
				}
				let spec =
					`<span class="col iconcol"><psicon pokemon="${pokemon1.id}"/></span>` +
					`<b>${pokemon1.name + "+" + pokemon2.name}</b>` +
					`<span class="col iconcol"><psicon pokemon="${pokemon2.id}"/></span>`;
				let baseStatsFusionText = `</b><table rules="all" border="all"><tr><b><th>HP</th><th>Attack</th><th>Defense</th><th>Sp.Attack</th><th>Sp.Defense</th><th>Speed</th><th>BST</th></b></tr> <tr><td>${baseStatsFusion["hp"]}</td><td>${baseStatsFusion["atk"]}</td><td>${baseStatsFusion["def"]}</td><td>${baseStatsFusion["spa"]}</td><td>${baseStatsFusion["spd"]}</td><td>${baseStatsFusion["spe"]}</td><td>${Object.values(baseStatsFusion).reduce((b: number, c: number) => b + c)}</td></tr></table>`;
				let typesText =
					`Types:<img src="https://play.pokemonshowdown.com/sprites/types/${pokTypes[0]}.png" alt="${pokTypes[0]}" height="14" width="32">` +
					(pokTypes[0] != pokTypes[1]
						? `<img src="https://play.pokemonshowdown.com/sprites/types/${pokTypes[1]}.png" alt="${pokTypes[1]}" height="14" width="32">`
						: ``);
				buffer =
					`<font color=#5c5c8a>` +
					spec +
					`<br/>` +
					typesText +
					baseStatsFusionText +
					`Abilities: ${filteredAbilities.join(", ")}` +
					`</font>`;
			} else
				return this.errorReply(
					`${(!pokemon1.exists ? sep[0] : "") + (!pokemon1.exists && !pokemon2.exists ? " and " : "") + (!pokemon2.exists ? sep[1] : "")} is not found, maybe you've made mistake?`,
				);
		} else return this.errorReply(`Choose 2 species of pokemon`);
		this.sendReply(`|raw|` + buffer);
	},
	fl: function (target, room, user, connection, cmd) {
		if (!this.runBroadcast()) return;

		let buffer = ``;
		let colorTable: { [key: string]: string } = {
			"???": `#1bc4a8`,
			Water: `#007fff`,
			Fire: `#ff9f32`,
			Grass: `#23a817`,
			Bug: `#8cb534`,
			Flying: `#a8fff1`,
			Rock: `#ad541d`,
			Steel: `#d1d1d1`,
			Ground: `#e8c681`,
			Ghost: `#7f53d1`,
			Normal: `#7a5e29`,
			Dark: `#8e004c`,
			Fairy: `#ff63f9`,
			Poison: `#af00e0`,
			Electric: `#fff89b`,
			Fighting: `#f47a7a`,
			Ice: `#cceaff`,
			Dragon: `#6435ff`,
			Psychic: `#ff5495`,
		};
		let sep = target.split(",");
		if (sep.length >= 2) {
			let pokemon1 = Dex.species.get(sep[0]);
			let pokemon2 = Dex.species.get(sep[1]);
			if (pokemon1.exists && pokemon2.exists) {
				buffer += `<details open="open"><summary><font color=#ad741a>${pokemon1.name}+${pokemon2.name} learnset</font></summary><font size=-2>`;
				let learnset = FusionScript.fuseLearnsets(pokemon1, pokemon2);
				let sortedLearnset = [...learnset.values()];
				sortedLearnset.sort(function (a, b) {
					let moveA = Dex.moves.get(a);
					let moveB = Dex.moves.get(b);
					if (moveA.type.toLowerCase() < moveB.type.toLowerCase())
						return -1;
					if (moveA.type.toLowerCase() > moveB.type.toLowerCase())
						return 1;
					if (moveA.category.toLowerCase() < moveB.category.toLowerCase())
						return -1;
					if (moveA.category.toLowerCase() > moveB.category.toLowerCase())
						return 1;
					if (moveA.name.toLowerCase() < moveB.name.toLowerCase())
						return -1;
					if (moveA.name.toLowerCase() > moveB.name.toLowerCase())
						return 1;
					return 0;
				});
				let prevMoveType = "";
				buffer += `<table bgcolor=#2d2d2d>`;
				for (let i in sortedLearnset) {
					let tag;
					let move = Dex.moves.get(sortedLearnset[i]);
					if (prevMoveType == "")
						buffer += `<tr><th><font color=${colorTable[move.type]}>${move.type}: </font> </th> <th> <font color=${colorTable[move.type]}>`;
					else if (prevMoveType != move.type)
						buffer += `</font> </th></tr><tr><th><font color=${colorTable[move.type]}>${move.type}: </font> </th> <th> <font color=${colorTable[move.type]}>`;
					if (move.category == "Special") tag = `u`;
					else if (move.category == "Physical") tag = `b`;
					if (tag) buffer += `<${tag}>${move.name}</${tag}>, `;
					else
						buffer += `<font color=${colorTable[move.type]}>${move.name}, `;
					prevMoveType = move.type;
				}
				buffer += `</font> </th></tr></font></details>`;
			} else
				return this.errorReply(
					`${(!pokemon1.exists ? sep[0] : "") + (!pokemon1.exists && !pokemon2.exists ? " and " : "") + (!pokemon2.exists ? sep[1] : "")} is not found, maybe you've made mistake?`,
				);
		} else return this.errorReply(`Choose 2 species of pokemon`);
		this.sendReply(`|raw|` + buffer);
	},
};
