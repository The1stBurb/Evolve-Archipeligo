//client side

import { techs } from '../src/tech.js';
import { actions } from '../src/actions.js';


function convAllFuncs(data){
    let ndata={};
    for(let i in data){
        if(typeof data[i] === 'object' && !Array.isArray(data[i])){
            ndata[i]=convAllFuncs(data[i]);
        }
        else if(typeof data[i] === 'function'){
            ndata[i]=data[i].toString();
        }
        else{
            ndata[i]=data[i];
        }
    }
    return ndata;
}

export const RUN_CREATE = !false;
export function runCreate(){
    // for(let i in techs){
    //     let tech=techs[i];
    //     if(techs[i].hasOwnProperty('condition')){
    //         techs[i]['condition']=techs[i]['condition'].toString();
    //     }
    // }
    let ntech=convAllFuncs(actions);
    // console.log(techs);
    fetch('/api/data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(ntech)
    });
}