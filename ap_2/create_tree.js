const fs=require('fs');

const ACTIONS=JSON.parse(fs.readFileSync('./ap_2/data/actions.json'));

function saveTechs(data,path){
    fs.writeFileSync(path ?? './ap_2/data/actions-new.json',JSON.stringify(data,'',2));
}

function convGrantnm(type,num){
    if(typeof type == 'object' && num == undefined){
        if(typeof Object.keys(type)[0] == 'string'){
            num = type['1'];
            type = type['0'];
        }
        else{
            num = type[1];
            type = type[0];
        }
    }
    return `${type}-${num}`;
}
function hasProp(item,prop){
    return typeof item == 'object' && item.hasOwnProperty(prop);
}
function keys(){
    return ;
}

function fixReqsGrants(ELMS){
    let grants={};
    for(let i in ELMS){
        let tech=ELMS[i];
        if(hasProp(tech, 'grant')){
            grants[convGrantnm(tech.grant)]=i;
        }
    }
    let unknowns={};
    for(let i in ELMS){
        let tech=ELMS[i];
        if(hasProp(tech, 'reqs')){
            let reqs=tech['reqs']
            let nreqs=[];
            for(let req in reqs){
                let nm=convGrantnm(req, reqs[req]);
                if(hasProp(grants, nm)){
                    nreqs.push(grants[nm]);
                }
                else{
                    console.log(`<-- Unknown Requirement for '${i}': '${nm}' -->`);
                    if(hasProp(unknowns, i)){
                        unknowns[i].push(nm);
                    }
                    else{
                        unknowns[i]=[nm];
                    }
                    nreqs.push(nm);
                }
            }
            tech['reqs']=nreqs;
        }
    }
    return unknowns
    // saveTechs(TECHS);
    // saveTechs(unknowns,'./ap_2/data/tech-unknowns.json');
}
function fixAllReqsGrants(){
    
    let unknowns={};
    for(let i in ACTIONS){

        if(MultiLevel.includes(i)){
            for(let j in ACTIONS[i]){
                try{
                    unknowns[convGrantnm(i,j)]=fixReqsGrants(ACTIONS[i][j]);
                }
                catch(e){
                    console.log(`<--- ERROR: Failed to fix actions.'${i}'.'${j}'! --->`);
                    console.log(e);
                }
            }
        }
        else{
            try{
                unknowns[i]=fixReqsGrants(ACTIONS[i]);
            }
            catch(e){
                console.log(`<--- ERROR: Failed to fix actions.'${i}'! --->`);
                console.log(e);
            }
        }
    }
    saveTechs(ACTIONS);
    saveTechs(unknowns,'./ap_2/data/tech-unknowns.json');
}


function handleGrants(elms, grants){
    for(let elm_nm in elms){
        let elm=elms[elm_nm];
        if(hasProp(elm, 'grant')){
            grants[convGrantnm(elm.grant)]=elm_nm;
        }
    }
}
function handleFix(elms, unknowns, grants){
    for(let elm_nm in elms){
        let elm=elms[elm_nm];
        if(hasProp(elm,'reqs')){
            
            let reqs=elm['reqs'];
            let nreqs=[];
            
            for(let req in reqs){
                let nm=convGrantnm(req, reqs[req]);

                if(hasProp(grants, nm)){
                    nreqs.push(grants[nm]);
                }
                else{
                    console.log(`<-- Unknown Requirement for '${elm_nm}': '${nm}' -->`);
                    if(hasProp(unknowns, elm_nm)){
                        unknowns[elm_nm].push(nm);
                    }
                    else{
                        unknowns[elm_nm]=[nm];
                    }
                    // nreqs.push(nm);
                }
            }
            elm['reqs']=nreqs;
        }
    }
}
function fixTwice(){
    const MultiLevel=['space','interstellar','galaxy','portal','tauceti','eden'];
    let grants={};
    let unknowns={};

    //get the grants right now
    for(let i in ACTIONS){
        if(MultiLevel.includes(i)){
            for(let j in ACTIONS[i]){
                handleGrants(ACTIONS[i][j], grants);
            }
        }
        else{
            handleGrants(ACTIONS[i], grants);
        }
    }
    saveTechs(grants, './ap_2/data/grants.json');

    //and now fix the reqs
    for(let i in ACTIONS){
        unknowns[i]={};
        if(MultiLevel.includes(i)){
            for(let j in ACTIONS[i]){
                unknowns[i][j]={};
                handleFix(ACTIONS[i][j], unknowns[i][j], grants);
            }
        }
        else{
            handleFix(ACTIONS[i], unknowns[i], grants);
        }
    }
    saveTechs(unknowns,'./ap_2/data/unknowns.json');
    saveTechs(ACTIONS);
}









let action='fix2';
switch(action){
    case 'fixReqs':
        fixAllReqsGrants();
    break;
    case 'fix2':
        fixTwice();
    break;
}