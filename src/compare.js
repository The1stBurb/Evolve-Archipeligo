function WardenMaxKnowledge(count,pcount){
    let gain_base=1000
    if (global.city.ptrait.includes('magnetic')){
        gain_base += planetTraits.magnetic.vars()[1];
    }

    let gain = count * gain_base;
    let powered_gain = global.tech['science'] >= 7 ? 1500 : 1000;
    gain += (pcount * powered_gain);


    if (global.tech['supercollider']){
        let ratio = global.tech['tp_particles'] || (global.tech['particles'] && global.tech['particles'] >= 3) ? 12.5: 25;
        gain *= (global.tech['supercollider'] / ratio) + 1;
    }
    if (global.space['satellite']){
        gain *= 1 + (global.space.satellite.count * 0.04);
    }
    let athVal = govActive('athleticism',2);
    if (athVal){
        gain *= 1 - (athVal / 100);
    }
    return gain
}

function effect(){
    let gain=WardenMaxKnowledge(1,0)
    gain = +(gain).toFixed(0);

    let desc = `<div>${loc('city_wardenclyffe_effect1',[jobScale(1),global.civic.scientist ? global.civic.scientist.name : loc('job_scientist')])}</div><div>${loc('city_max_knowledge',[gain.toLocaleString()])}</div>`;
    if (global.city.powered){
        let pgain=WardenMaxKnowedge(0,1)
        pgain = +(pgain).toFixed(1);

        if (global.tech.science >= 15){
            desc = desc + `<div>${loc('city_wardenclyffe_effect4',[2])}</div>`;
        }
        if (global.race.universe === 'magic'){
            let mana = spatialReasoning(8);
            desc = desc + `<div>${loc('plus_max_resource',[mana,global.resource.Mana.name])}</div>`;
        }
        if (global.tech['broadcast']){
            let morale = global.tech['broadcast'];
            desc = desc + `<div class="has-text-caution">${loc('city_wardenclyffe_effect3',[$(this)[0].powered(),pgain.toLocaleString(),morale])}</div>`
        }
        else {
            desc = desc + `<div class="has-text-caution">${loc('city_wardenclyffe_effect2',[$(this)[0].powered(),pgain.toLocaleString()])}</div>`;
        }
        if (global.race['artifical']){
            desc = desc + `<div class="has-text-caution">${loc('city_transmitter_effect',[spatialReasoning(250)])}</div`;
        }
    }
    return desc;
}




let wardenCount=global.city['wardenclyffe'].count
lCaps['scientist'] += jobScale(wardenCount,p_on['wardenclyffe']);
let gain=WardenMaxKnwoledge(wardenCount)
caps['Knowledge'] += gain;
breakdown.c.Knowledge[wardenLabel()] = gain+'v';




