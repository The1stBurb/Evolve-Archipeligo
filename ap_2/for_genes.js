import { traits, races } from '../src/races.js';
import { actions, checkTechQualifications as techQual, raceList, sentience } from '../src/actions.js';
import { global } from '../src/vars.js';
import { warhead } from '../src/resets.js';


export const RUN_TECHR = false;
export function runTechr(){
    console.log('it has begun');
    for(let race_i in raceList){
        let race=raceList[race_i];
        evolve(race);
        for(let i in actions.tech){
            let c_action=actions.tech[i];
            let title = i;
            try {
                title = actions.tech[i].title;
                title = typeof title == 'string' ? title : title();
            }
            catch{}
            let qual=techQual(c_action,'yep');
            console.log('checking: ',title,qual)
            // console.log(c_action,qual);
            // break;
        }
        break;
    }
    evolve('entish');
    // console.log(global);
}
function evolve(race){
    if(race == 'hybrid' || race == 'custom' || race == 'nano'){
        console.log('Ignoring species:',race);
        return;
    }
    warhead();
    console.log('evolveing into race:',race);
    global.race.species = race;
    global.race.maintype = races[race].type;
    if(global.race.maintype == 'hybrid'){
        console.log('ignoring species:',race,'as it is a hybrid');
        return;
    }
    sentience();
}