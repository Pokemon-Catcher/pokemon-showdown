const { Teams } = require('./dist/sim/teams');
const { TeamValidator } = require('./dist/sim/team-validator');
const { Dex } = require('./dist/sim/dex');
const packed = "Luvdisc||HeavyDutyBoots|SwiftSwim|moonblast,hydropump,poisonjab,flipturn||85,85,85,85,85,85|M|||64|,,,,,Ground]Persian|PersianAlola|SitrusBerry|FurCoat|bellydrum,darkpulse,terablast,flareblitz||85,85,85,85,85,85|F|||86|,,,,,Ghost]Politoed||Leftovers|WaterAbsorb|flareblitz,gunkshot,hydropump,nastyplot||85,85,85,85,85,85|F|||83|,,,,,Water]Farigiraf||Leftovers|SapSipper|hypervoice,psychicnoise,defog,headbutt,stickyweb,roost||85,85,85,85,85,85|F|||87|,,,,,Fairy]Victreebel||LifeOrb|Moxie|energyball,ironhead,swordsdance,sludgebomb||85,85,85,85,85,85|M|||77|,,,,,Steel]Rhydon||Eviolite|RockHead|outrage,earthquake,moonlight,stoneedge||85,85,85,85,85,85|M|||85|,,,,,Dragon";
const parsedTeam = Teams.unpack(packed)

const baseFormat = Dex.formats.get('gen9fusionmonsrandombattle');

// 3. Создаем кастомный формат для теста: клонируем правила, но разрешаем кастомную команду
const testFormat = Object.assign({}, baseFormat, {
	id: 'gen9fusionmonstest',
	name: 'Gen 9 Fusionmons Test',
	team: undefined, // Удаляем триггер случайной генерации
	validateTeam: undefined // Отключаем верхнеуровневый запрет на кастомные команды
});

// 4. Запускаем валидатор с нашими тестовыми правилами
const validator = new TeamValidator(testFormat);
const errors = validator.validateTeam(parsedTeam);

if (errors) {
	console.log("❌ Внутренние ошибки валидации покемонов:");
	console.log(errors);
} else {
	console.log("✅ С точки зрения правил формата, покемоны собраны корректно!");
}