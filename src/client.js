// import readline from "node:readline";

import { Client } from "./archipelago.js";
// import { Client } from "https://unpkg.com/archipelago.js/dist/archipelago.min.js";
import { messageQueue, vBind, popover } from "./functions.js";
import { actions, initStruct, setPlanet, runAction, actionDesc, removeAction } from "./actions.js"
import { eventList, events } from './events.js'
import { global, seededRandom, atrack } from './vars.js'
import { incrementStruct } from './space.js'
import { loc } from './locale.js'
import { drawGenes, arpa, genePool } from './arpa.js'
import { races }from './races.js'
const client = new Client();
// client.deathLink.enableDeathlink();

var connectInfo=null;
var gameSeed=0;
window.addedListeners=false;
window.connected=false;
window.itemTable={}
window.locTable={}
window.ritemTable={}
window.rlocTable={}
var data={}

const items={
    filler:{
        "building":triggerBuilding,
        "resources":triggerResourceBonus,
        "plasmid":{
            "1":triggerPlasmid1,
            "2":triggerPlasmid2,
            "3":triggerPlasmid3,
            "4":triggerPlasmid4,
        },
        "phage":{
            "1":triggerPhage1,
            "2":triggerPhage2,
            "3":triggerPhage3,
        },
        "antiplasmid":{
            "1":triggerAntip1,
            "2":triggerAntip2,
        },
        "power":triggerPowerBonus,
        "prod":triggerProdBonus,
        "pop":triggerPopBonus,
    },
    trap:{
        "resources":triggerResourceMalus,
        "power":triggerPowerMalus,
        "prod":triggerProdMalus,
        "attack":triggerAttack,
    },
    crispr:triggerCrispr,
}


//special seeded random based on index for replication!
function apRandom(min, max, indexSeed) {
    max = max || 1;
    min = min || 0;

    let seed = (global.gameSeed||0)+indexSeed
    let newSeed = (seed * 9301 + 49297) % 233280;
    global.gameSeed=newSeed;
    let rnd = newSeed / 233280;
    return min + rnd * (max - min);
}

//login!
export function login(user,port,pass){
    // global.settings.pause=true

    connectInfo={
        port: port || localStorage.getItem("port") || Error,//"archipelago.gg:38281", // Default hostname
        game: "Evolve2",
        user: user || localStorage.getItem("user") || "Player1",
        pass: pass || localStorage.getItem("pass") || "",
        items_handling: 0b111,
    };
    var msg=`Logging in as '${connectInfo.user}' to port '${connectInfo.port}' from the game '${connectInfo.game}' with the password '${(connectInfo.pass==""?"No Password Was Used!":"*".repeat(connectInfo.pass))}'`
    console.log(msg)
    messageQueue(msg,"arch",false,["all"])
    connectToServer();
    window.addEventListener("beforeunload", () => {
        client.socket.disconnect();
    });
}

//dont need!
function foundEventManager(item){
    if(item){
        var foundEvents=foundEventManager();
        localStorage.setItem(JSON.stringify(foundEvents+[item]))
    }
    else{
        return JSON.parse(localStorage.getItem("foundEvent")) || [];

    }
}
//helper functions
function prestigeMod(type,amnt,setTo){
    if(setTo){
        global.prestige[type].count=amnt;
        global.stats[type.toLowerCase()]=amnt;
    }
    else{
        global.prestige[type].count+=amnt;
        global.stats[type.toLowerCase()]+=amnt;
    }
}

function randChoice(arr,index) {
    if (!arr.length) return null;
    return arr[Math.floor(apRandom(0,arr.length,index))];
}

function updateItems(item,index){
    // console.log(item,typeof item)
    item=item.split(":")
    item=[item[0].split("-"),item[1].split("_")]
    var ids=item[0]
    var item=item[1]
    // item[1]=item[1].split("_")
    // var ids=item[0].slice(5),item=item[1];
    switch(ids[1]){
        case "filler":
            if(item[0]=="plasmid"||item[0]=="phage"||item[0]=="antiplasmid"){items.filler[item[0]][item[1]](index)}
            else{items.filler[item[0]](index)}
        break;
        case "trap":
            items.trap[item[0]](index)
        break
        case "crispr":
            items.crispr(index,item[0])
        break
        case "tech":
            item=item.join("_")
            if(!actions.tech.hasOwnProperty(item)){
                console.error("WOW THIS ITEM NO EXSIT: "+item);
                return
            }
            if(!actions.tech[item].hasOwnProperty("arch")){
                console.error("OH DEAR item "+item+" hasnt been configured properly!");
                return
            }
            actions.tech[item].arch.locked=false;
            // console.log(item+" is now availible! "+actions.tech[item].arch.locked)
        break;
        default:
            console.log("Uh Oh! Invalid item!",ids,item)        
    }
    
}

function triggerBuilding(index){
    var builds=Object.keys(global.city);
    builds=builds.slice(builds.indexOf("power_total")+1)
    // console.log(builds);
    var attempts=0;
    while(attempts<20){
        attempts+=1;
        var bld=randChoice(builds,index);
        if(!bld.includes("ap_")&&global.city[bld].count>0){
            incrementStruct(bld,'city');
            // console.log(bld)
            var title=actions.city[bld].title
            if(typeof title==="function"){title=title()}
            messageQueue(`You have gained another ${title}${getPlayer()}!`,"archItem",false,["all"]);
            attempts=200
        }
    }
    
}
function getPlayer(){
    return players.length>0?` from ${players.pop()}`:""
}

var resForItem=["DNA","RNA","Money","Knowledge","Food","Lumber","Stone","Furs","Copper","Iron","Aluminium","Cement","Coal","Oil","Uranium","Steel","Titanium","Alloy","Polymer","Plywood","Brick","Wrought_Iron","Sheet_Metal",]
function triggerResourceBonus(index){//right now special kind are       
    // var res=Object.keys(global.resource);
    var attempts=0;
    // var totalAmnt=apRandom(0,20000)
    while(attempts<50){
        attempts+=1;
        var chosRes=randChoice(resForItem,index+attempts*resForItem.length)
        // console.log(chosRes)
        if(global.resource[chosRes].display){
            var amnt=100;
            if(global.resource[chosRes].max==-1){amnt=Math.floor(apRandom(0,1000,attempts+index))}
            else{amnt=Math.floor(apRandom(0,global.resource[chosRes].max-global.resource[chosRes].amount,index))}
            // console.log(0,global.resource[chosRes].max-global.resource[chosRes].amount)
            global.resource[chosRes].amount+=amnt;
            attempts=120;
            messageQueue(`You gained ${amnt} ${chosRes}${getPlayer()}.`,"archItem")
        }
    }
    // console.log("finished",attempts)
}
// var global.resouce
function triggerPlasmid1(index){
    var amnt=Math.round(apRandom(1,10,index))
    prestigeMod("Plasmid",amnt);
    messageQueue(`You gained ${amnt} Plasmids!${getPlayer()}`,"archItem");
}
function triggerPlasmid2(index){
    var amnt=Math.round(apRandom(10,25,index))
    prestigeMod("Plasmid",amnt);
    messageQueue(`You gained ${amnt} Plasmids!${getPlayer()}`,"archItem");
}
function triggerPlasmid3(index){
    var amnt=Math.round(apRandom(25,50,index))
    prestigeMod("Plasmid",amnt);
    messageQueue(`You gained ${amnt} Plasmids!${getPlayer()}`,"archItem");
}
function triggerPlasmid4(index){
    var amnt=Math.round(apRandom(50,100,index))
    prestigeMod("Plasmid",amnt);
    messageQueue(`You gained ${amnt} Plasmids!${getPlayer()}`,"archItem");
    // global.prestige.Plasmid.count += amnt;
    // global.stats.plasmid += amnt;
}
function triggerPhage1(index){
    var amnt=Math.round(apRandom(1,10,index))
    prestigeMod("Phage",amnt);
    messageQueue(`You gained ${amnt} Phage${getPlayer()}!`,"archItem");
    // global.prestige.Phage.count += amnt;
    // global.stats.phage += amnt;
}
function triggerPhage2(index){
    var amnt=Math.round(apRandom(10,25,index))
    prestigeMod("Phage",amnt);
    messageQueue(`You gained ${amnt} Phage${getPlayer()}!`,"archItem");
}
function triggerPhage3(index){
    var amnt=Math.round(apRandom(25,50,index))
    prestigeMod("Phage",amnt);
    messageQueue(`You gained ${amnt} Phage${getPlayer()}!`,"archItem");
}
function triggerAntip1(index){
    var amnt=Math.round(apRandom(1,10,index))
    // global.prestige.AntiPlasmid.count += amnt;
    // global.stats.antiplasmid += amnt;
    prestigeMod("AntiPlasmid",amnt);
    messageQueue(`You gained ${amnt} Anti-Plasmids${getPlayer()}!`,"archItem");
}
function triggerAntip2(index){
    var amnt=Math.round(apRandom(10,25,index))
    prestigeMod("AntiPlasmid",amnt);
    messageQueue(`You gained ${amnt} Anti-Plasmids${getPlayer()}!`,"archItem");
}
function triggerCrispr(index,type){
    if(global.genes.hasOwnProperty(type)){
        global.genes[type]+=1;
    }
    else{
        global.genes[type]=1;
    }
    messageQueue(`The CRISPR gene ${type} has been upgraded to level ${global.genes[type]}${getPlayer()}!`,"archItem")
}
function triggerPowerBonus(index){
    addBuilding("ap_power_bonus")
    // runAction(actions.city["ap_power_bonus"],"city","ap_power_bonus")
    // incrementStruct("ap_power_bonus","city","itemTrigger")
    messageQueue(`You get +5MW${getPlayer()}!`,"archItem")
}
function triggerProdBonus(index){
    incrementStruct("ap_prod_bonus","city","itemTrigger")
    messageQueue(`You get +5% to production${getPlayer()}!`,"archItem")
}
function triggerPopBonus(index){
    incrementStruct("ap_pop_bonus","city","itemTrigger")
    messageQueue(`You get +1 to population${getPlayer()}!`,"archItem")
}

function addBuilding(name,typ){
    runAction(actions.city[name],typ??"city",name)
    actions.city[name].apInc()
}

function triggerResourceMalus(index){
    // var res=Object.keys(global.resource);
    var attempts=0;
    // var totalAmnt=apRandom(0,20000)
    while(attempts<50){
        attempts+=1;
        var chosRes=randChoice(resForItem,index+attempts*resForItem.length)
        // console.log(chosRes)
        if(global.resource[chosRes].display){
            var amnt=Math.floor(apRandom(1,global.resource[chosRes].amount/2,index))
            // console.log(0,global.resource[chosRes].max-global.resource[chosRes].amount)
            global.resource[chosRes].amount-=amnt;
            // console.log(attempts)
            attempts=120;
            messageQueue(`You lose ${amnt} ${chosRes}${getPlayer()} due to a trap.`,"archTrap")
        }
    }
    // console.log("finished",attempts)
}
function triggerPowerMalus(index){
    addBuilding("ap_power_malus")
    // incrementStruct("ap_power_malus","city","itemTrigger")
    messageQueue(`You get -1MW${getPlayer()} due to a trap!`,"archTrap")
}
function triggerProdMalus(index){x
    incrementStruct("ap_prod_malus","city","itemTrigger")
    messageQueue(`You get -2% to production${getPlayer()} due to a trap!`,"archTrap")
}
function triggerAttack(index){
    var happen="error!"
    if(Math.floor(apRandom(0,2,index))==0){happen=events.siege.effect()}
    else{happen=events.raid.effect()}
    messageQueue(happen,"caution",false,["events","major_events"])
    messageQueue(`You got attacked${getPlayer()} due to a trap!`,"archTrap")
}

//update any new items!

var players=[];
//connect to the server
function connectToServer(){
    // global.race.gods=global.race.species
    //login obviously
    client.login(connectInfo.port, connectInfo.user,connectInfo.game,{password:connectInfo.pass})
    .then(() => {
        console.log("Connected to the Archipelago server!")
        onConnected()
        // global.genes["governor"]=true

    })
    .catch((error)=>{
        console.log("Failed to connect", error);
        let txt = (error && error.message) ? error.message : String(error);
        if (txt.includes("InvalidGame")){
            messageQueue("Game is incorrect or something!","archError",false,["all"])
            return;
        }else{
            messageQueue(`ERROR: ${txt}`,"archError",false,["all"]);
            messageQueue("Try refreshing the game and logging in again!","archError",false,["all"]);
        }
        window.connected=false;
    });

    

    //From spineraks Yacht Dice
    const connectedListener = (packet) => {
        console.log("Connected to server: ", packet);
        const packetTeamName = packet.team;
        const packetSlotName = packet.slot;
        console.log("_read_client_status_"+packetTeamName+"_"+packetSlotName)
        console.log(packet)
        
        if(!global.setupComplete||true){
            var opt=packet.slot_data;
            prestigeMod("Plasmid",opt.plasmid,true);
            prestigeMod("Phage",opt.phage,true);
            prestigeMod("AntiPlasmid",opt.antip,true);
            global.opts.deathlink=opt.deathlink==1?true:false;
            global.opts.deathamn=opt.deathamn;
            global.opts.deathperc=opt.deathperc/100;

            if(opt.relig){
                global.genes["ancients"]=2;
                global.tech["theology"]=1
            }
            if(opt.govnr)global.genes["governor"]=0;

            global.ap_genus=["other","carnivore","avian","plant","heat","angelic","fungi","demonic","synthetic","eldritch"][opt.genus];
            console.log(global.ap_genus,"eeeeeeeeeee")
            if(opt.univ!="standard"){
                global.race['universe']=opt.univ
                global.opts.univ=opt.univ
            }
            global.settings.at=opt.speed*60*60/2.5
            atrack.t = global.settings.at;
            if(opt.prerace){
                global.race.gods=["error","Human", "elf", "orc", "kobold", "goblin", "gnome", "ogre", "cyclops", "troll", "tortoisan", "gecko", "sliheryn", "cacti", "pinguicula", "sporgar", "shroomi", "moldling", "mantis", "scorpid", "antid", "sharkin", "octigoran", "dryad", "satyr", "phoenix", "salamander", "yeti", "wendigo", "tuskin", "kamel", "balrog", "imp", "seraph", "unicorn", "synth", "nano", "ghast", "shoggoth", "dwarf", "lichen", "wyvern", "eye-spector", "djinn", "narwhalus", "bombardier", "nephilim", "hellspawn", "cath", "wolven", "vulpine", "centaur", "rhinotaur", "capybara", "araak", "pterodacti", "dracnid", "ent", "racconar", "dwarf", "racconar"][opt.prerace]
            }
            else{
                global.race.gods=global.race.species
            }
            global.setupComplete=true;

            
            global.ap_stats={
                plasmid:opt.plasmid,
                phage:opt.phage,
                antip:opt.antip,

                deathsTot:0,
                deathsTrig:0,

                deathlink:opt.deathlink,
                deathamn:opt.deathamn,
                deathperc:opt.deathperc,

                start2x:opt.speed,
                prerace:opt.prerace,

                relig:opt.relig,
                govnr:opt.govnr,

                genus:opt.genus,

            }
        }
        else{
            var opt=packet.slot_data;
            global.opts.deathlink=opt.deathlink==1?true:false;
            global.opts.deathamn=opt.deathamn;
            global.opts.deathperc=opt.deathperc/100;

            if(global.race.gods=="none"){global.race.gods=global.race.species;}
        }
            
        // console.log(global.race.gods)
        // console.log(global.opts.deathlink)
        
    };

    //from spineraks Yacht Dice
    const disconnectedListener = (packet) => {
        console.log("DISCONNECTED!");
        window.connected = false;
        // global.settings.pause=true;
        messageQueue("WARNING: You are disconnected! Trying to reconnect...","archError",false,["all"])
    }
    //from spineraks Yacht Dice, but disabled bcause its not needed
    const roomupdateListener = (packet) => {
        // updateMissingLocations(packet);
        // updateRequiresValue(packet);
        console.log("Room update:", packet)
        //newItems(packet)
    };


    //from spineracks Yacht Dice, but modified
    const receiveditemsListener = (items, index,override) => {
        // console.log()
        console.log(`Receiveditemslistener(${items},${index})`);
        console.log(global.itemcount,"itemcount1")
        var newItems=0
        for(var i=global.itemcount-index; i<items.length; i++){
            if(i<0){continue}
            newItems+=1
            try{updateItems(items[i].name,i+global.itemcount);}
            catch(e){
                console.log("SOMETHING WENT WRONG WITH"+items[i].name,e)
            }
            // messageQueue(`You recieved '${items[i]}'!`);
        }
        global.itemcount+=newItems;
        console.log(global.itemcount,"itemcount2")
    };

    function jsonListener(text, nodes) {
        var msgText=""
        var hasItem=false
        var player=""
        // console.log(nodes)
        var stop=false
        // var itemMessage
        //convert nodes to text
        for(const node of nodes){
            var nodeTxt=node.text

            msgText+=nodeTxt;
            if(node.type=="item"||node.type=="location"){
            //     nodeTxt=itemLocText(node.text)
            //     if(nodeTxt=="stop")stop=true
                if(node.type=="item"){hasItem=true}
            }
            if(node.type=="player"){
                if(node.player.slot!=client.players.self.slot){
                    player=node.text;
                }
            }
            // if(node.type=="item")hasItem=true;
            //this bit of code doesnt work because of evolve code. Imma see if i can fix that but later
            // console.log(node.type);
            // if(node.type=="player"){
            //     if(node.player.slot==client.players.self.slot){
            //         nodeTxt=`<b>${nodeTxt}</b>`;
            //     }
            //     else{
            //         nodeTxt=`<i>${nodeTxt}</i>`;
            //     }
            // }
            // else if(node.type=="item"){
            //     nodeTxt=`<u>${nodeTxt}</u>`;
            // }
            // console.log(nodeTxt);
            msgText+=" "+nodeTxt;
        }
        if(hasItem&&player){
            players.push(player)
        }
        if(stop)return
        //make sure newlines are handled properly
        msgText=msgText.split("\n");
        for(const txt of msgText){
            messageQueue(txt.toString(),"arch",false,["all"]);
        }
        
                
    }

    function deathlinkListener(source,time,cause,msg){
        // console.log(global.opts.deaths,global.opts.deathamn,global.opts);
        global.opts.deaths++;
        global.ap_stats.deathsTot++;
        if(global.opts.deaths>=global.opts.deathamn){
            // console.log("You ran out of luck!")
            global.opts.deaths=0;
            global.opts.deathsTrig++;
        }
        else{
            // console.log("your good")
            sendMsg(`${cause} However, too few deaths have happened for Death Link to trigger! (${global.opts.deaths}/${global.opts.deathamn})`,"archItem")
            return
        }
        // console.log("deathlink_occured",source,time,cause)
        var jobs=["unemployed","hunter","forager","farmer","lumberjack","quarry_worker","scavenger","teamster","miner","coal_miner","craftsman","cement_worker","entertainer","priest","professor","scientist","banker","garrison"]
        var tot=0;
        jobs.forEach(function(title){
            if(global.civic.hasOwnProperty(title)){
                tot+=global.civic[title].workers
                global.civic[title].workers=0;
                // console.log(global.civic[title].workers,title)
            }
        })
        global['resource'][global.race.species].amount=1;
        messageQueue(`${cause} A total of ${tot-1} citizens died in result of Death Link.`,"archTrap",false,["all"])
        var d_job=(global.race['carnivore'] || global.race['soul_eater'] || global.race['unfathomable'])?"hunter":(global.race['forager']?"forager":"farmer")
        global.civic[d_job].workers=1
        global.civic["d_job"]=d_job
    }
    //only add the listenres if they have been added!
    if(!window.addedListeners){
        console.log("listeners created oop")
        client.socket.on("connected", connectedListener);
        client.socket.on("disconnected", disconnectedListener);
        client.room.on("roomUpdate", roomupdateListener);
        client.items.on("itemsReceived", receiveditemsListener);
        client.messages.on("message", jsonListener);
        client.messages.on("itemSent", itemSentListener);
        client.room.on("locationsChecked", locationsCheckedListener);
        client.deathLink.on("deathReceived",deathlinkListener)
        window.addedListeners=true;
    }
}
function itemLocText(item){
    // console.log(item,typeof item)
    item=item.split(":")
    if(item.length==1){
        return item[0]
    }
    else{
        item=[item[0].split("-"),item[1].split("_")]
        var ids=item[0]
        var item=item[1]
        // console.log(ids)
        if(ids[0]=="item"){
            if(ids[1]=="build"){
                return loc("city_"+item.join("_"))
            }
            // if(ids[1]=="tech"){

            // }
            // else if(ids[1]=="filler"){
            //     return "stop"
            // }
            return "stop"//ids.join("-")+":"+item.join("_")
        }
        else if(ids[0]=="loc"){
            if(ids[1]=="build"){
                return loc("city_"+item.join("_"))
            }
            else{
                return loc("tech_"+item.join("_"))
            }
        }
    }
}
function onConnected(){
    //set user info
    window.connected=true;
    localStorage.setItem("port",connectInfo.port);
    localStorage.setItem("user",connectInfo.user);
    localStorage.setItem("game",connectInfo.game);
    localStorage.setItem("pass",connectInfo.pass);
    
    //get any necesary data fot items and such
    data=client.package.findPackage("Evolve");
    window.itemTable=data.itemTable
    window.locTable=data.locationTable
    window.ritemTable=data.reverseItemTable
    window.rlocTable=data.reverseLocationTable
    // global.settings.pause=false

    //handle any locations reached while offline
    var offlineLocs=global.offlineLocs;
    console.log(offlineLocs,"hey");
    for(var i=0; i<offlineLocs.length; i++){
        reachedLocation(offlineLocs[i][0],offlineLocs[i][1],true)
    }
    global.offlineLocs=[]

    //fetch the game seed
    client.storage.fetch("gameSeed").then(fgameSeed=>{
        if(fgameSeed){//if it exsist, cool
            console.log("Fetched game seed"+fgameSeed)
            global.gameSeed=fgameSeed;
        }
        else{//otherwise set it to be the evolve seed
            console.log("no game seed found, using evolve seed"+global.seed)
            client.storage.prepare("gameSeed",[]).replace(global.seed).commit()
            global.gameSeed=global.seed
        }
    })
    .catch((error)=>{//same as above
        console.log("Something went wrong with fetching the game seed! defaulting to evolve seed!")
        client.storage.prepare("gameSeed",[]).replace(global.seed).commit()
        global.gameSeed=global.seed
    })
    if(global.opts.deathlink){
        client.deathLink.enableDeathLink();
        // console.log(client.deathLink)
    }
}

var saveYDDInformation=1;
//dont think i need this!, from spineraks Yacht Dice
function itemSentListener(text, item, nodes){
    if(saveYDDInformation == 1){
        let sender = item.sender;
        let receiver = item.receiver;
        if(sender.slot == client.players.self.slot){
            console.log("ITEM SENT AND REGISTER", text, item, nodes);
            client.storage.prepare("YADI_I"+receiver.slot, []).add([item.id]).commit() // Activate Archipelago storage.
        }
    }
}

//dont think i need this! from spineraks Yacht Dice
var missingLocations=[];
function locationsCheckedListener(locations){
    // console.log(locations)
    // for (let item of locations) {
    //     if (missingLocations.includes(item)) {
    //         missingLocations.splice(missingLocations.indexOf(item), 1);
    //     }
    // } 
    // updateHighscoreAndGoal();
    
}

var logined=false;
//this is silly, but dont worry
function commandCheck(text,command){
    return text.toLowerCase().slice(0,command.length)==command
}

function sendMsg(msg,typ){
    messageQueue(msg,typ??"arch",false,["all"])
}
var evolveCommands=[["!e help","Lists commands and their functions."],["!login","Login to the game. Formatted: '!login name archipelago.gg:[port num] optional_password' If your name includes spaces, SURROUND IT WITH QUOTATION MARKS(\")!!!"]]
function sendCommand(text){
    // console.log(text.slice(0,6)+"|")
    // console.log(commandCheck(text,"!login"),0,"!login".length+1)
    if(commandCheck(text,"!login")){
        if(text.includes('"')){
            var starti=text.indexOf('"')
            var endi=text.lastIndexOf('"')
            var user=text.slice(starti+1,endi);
            text=text.slice(0,starti)+text.slice(endi+2)
        }
        text=text.split(" ");
        if(window.connected){return}
        if(user){
            login(user,text[1],text.length>2?text[2]:null);
        }
        else{
            login(text[1],text[2],text.length>3 ? text[3]:null);
        }
        logined=true;
        return
    }
    else if(commandCheck(text,"!random")||commandCheck(text,"!rand")){
        seededRandom(0,100000)
        return
    }
    else if(commandCheck(text,"!e help")){
        for(var i=0; i<evolveCommands.length; i++){
            var comd=evolveCommands[i];
            sendMsg("-- "+comd[0]+" -> "+comd[1]);
        }
        sendMsg("Here is a list of all the Evolve commands:")
        return
    }
    else if(commandCheck(text,"!help")){
        sendMsg("If you wish to use the Evolve command help, use '!e help'")
        return
    }
    else if(commandCheck(text,"!give")){
        updateItems(text.split(" ")[1],-1);
        return
    }   
    else if(commandCheck(text,"!send")){
        console.log("sending "+text.split(" ").slice(1).join(" "));

        client.scout([parseInt(text.split(" ").slice(1).join(" "))],1);
        return
    }
    else if(commandCheck(text,"!trigger")){
        var cause=text.split(" ")[1]
        var count=1;
        var dloc=["city1","city2","city3","a rival city","rival cities"];
        if(Math.round(Math.random())==0){
            count=Math.round(Math.random()*100)
        }
        triggerDeathLink({"cause":cause,"count":count,"loc":dloc[Math.floor(Math.random()*dloc.length)]})
        
        return
    }
    else if(commandCheck(text,"!items")){
        updateItems(text.split(" ")[1],10+Math.random()*1000)
        return
    }
    console.log("sending command:"+text,);
    client.messages.say(text);
    
}

export function triggerDeathLink(args){
    var cause="";
    var player=client.players.self.alias
    global.ap_stats.deathsCaused++;
    switch(args.cause){
        case "starve":
            if(args.count==1){
                cause=`${player} let a citizen starve!`;
            }
            else{
                cause=`${player} let ${args.count} citizens starve!`;
            }
        break;
        case "attacked":
            if(args.count==1){
                cause=`One of ${player}'s soldiers died while attacking ${args.location}!`
            }
            else{
                cause=`${args.count} of ${player}'s soldiers died while attacking ${args.location}!`
            }
        break;
        case "attackedBy":
            if(args.count==1){
                cause=`One soldier died while defending ${player}'s town from an attack by ${args.location}!`
            }
            else{
                cause=`${args.count} soldiers died while defending ${player}'s town from an attack by ${args.location}!`
            }
        break
        case "fight":
            if(args.count==1){
                cause=`One of ${player}'s soldiers died!`
            }
            else{
                cause=`${args.count} of ${player}'s soldiers died!`
            }
        break;
        case "spy":
            cause=`A spy for ${player} was caught in the ${args.loc}!`;
        break;
        case "brawl":
            if(args.count==1){
                cause=`After a brawl, one of ${player}'s citizens were found dead!`
            }
            else{
                cause=`After a brawl, ${args.count} of ${player}'s citizens were found dead!`
            }
        break
        default:
            console.error("Tried to trigger death link but ",args,"is unknown")
            cause="unknown!"
    }
    // deathLinkListener()
    client.deathLink.sendDeathLink(client.players.self.slot,cause);

}

//initialize anything needed, mostly an added structures and the chat part
let curVersion=[0,3,13]
export function initChatModule(){
    global.offlineLocs=[];
    document.getElementById("commandInpForm").addEventListener("submit", function (event) {
      event.preventDefault(); // prevent page reload
      console.log("sending:",document.getElementById("commandInput").value)
      sendCommand(document.getElementById("commandInput").value);
    //   console.log(document.getElementById("commandInput").value);
      this.reset();
    });
    //make any added structures work!
    if(!global.ap_init||true){
        // console.log("initialize")
        // console.log(global.city)
        let special_locs=["ap_power_bonus","ap_power_malus","ap_prod_bonus","ap_prod_malus","ap_pop_bonus"]
        special_locs.forEach(function(buildName){
            initStruct(actions.city[buildName])
        })
        // initStruct(actions.city.ap_power)
        // global.tech["theology"]=1
        global.ap_init=true
    }
    
    for(var i in genePool){
        genesInPool[`${genePool[i].grant[0]}:${genePool[i].grant[1]}`]=i
    }

    global.settings.arpa.crispr = true;
    global.settings.arpa.arpaTabs = 2;
    global.settings.showGenetics = true;
    arpa("Crispr",true);
    $("#topBar #clientVersion").html(`Client: v${curVersion[0]}.${curVersion[1]}.${curVersion[2]}`)
}

var genesInPool={}

export function drawHasCrispr(){
    var parent=$("#has_genes")
    var nm=""
    for(var i in global.genes){
        for(var j=1; j<=global.genes[i]; j++){
            nm=`${i}:${j}`
            // console.log(global.genes[i],i)
            // console.log(nm)
            if(!genesInPool.hasOwnProperty(nm)){
                // console.log(nm,"woops")
                console.log("woops")
                continue
            }
            let c_action=genePool[genesInPool[nm]]
            removeAction(c_action.id)
            var element=$(`<div id="${c_action.id}" class="action hl"></div>`)
            let clss = ``;
            if (c_action['class']){
                clss = typeof c_action['class'] === 'function' ? ` ${c_action.class()}`: ` ${c_action['class']}`;
            }
            var active=`<span class="is-sr-only">${loc('not_active')}</span>`;
            element.append($(`<a class="button is-dark${clss}" role="link"><span class="aTitle" v-html="$options.filters.title(title)"></span></a><a role="button" v-on:click="describe" class="is-sr-only">{{ title }} description</a>`))//
            parent.append(element)
            vBind({
                el:"#"+c_action.id,
                data:{
                    title: typeof c_action.title === 'string' ? c_action.title : c_action.title(),
                },
                methods:{
                    describe(){
                        srSpeak(srDesc(c_action,false))
                    }
                },
                filters:{
                    title(t){
                        return t
                    }
                }
            })
            let type=genesInPool[nm]
            popover(c_action.id,function(){ return undefined; },{
                in: function(obj){
                    // console.log(type)
                    actionDesc(obj.popper,c_action,global["genes"][type],null,"genes",type);
                },
                out: function(){
                    vBind({el: `#popTimer`},'destroy');
                    // clearPopper(c_action.id)
                },
                attach: '#main',
                wide: c_action['wide'],
                classes: c_action.hasOwnProperty('class') ? c_action.class : false,
            });
        }
    }
    // parent.append()
}

// var offlineLocs=[]
//manages locations when reached
export function reachedLocation(type,loc){
    // console.log(type,loc)
    //if not connected send it to the offline handler, otherwise the client can handle it
    if(!window.connected){
        // console.log(global)
        global.offlineLocs.push([type,loc])
    }
    else{client.check(window.locTable[`loc-${type}:${loc}`])}
}

const stringPack={
    plasmid:"Starting Plasmids",
    phage:"Starting Phage",
    antip:"Starting Anti-Plasmids",

    deathsTot:"Total Deaths",
    deathsTrig:"Total Death Links Triggered",
    deathsCaused:"Death Links Caused",

    deathlink:"Death Link Active",
    deathamn:"Death Link Amnesty",
    deathperc:"Death Link Percent",

    start2x:"Starting 2x Speed",
    prerace:"Chosen Gods",

    relig:"Religion Unlocked",
    govnr:"Governors Unlocked",

    runTime:"Game Days Taken",
    runTimeActual:"Estimated Time Taken",
    "tier-1":"cause Mutually Assured Destruction and a resulting nuclear winter",
    "tier-2":"Bioseed on a new planet",
    "tier-3":"explode the blackhole and destroy the universe",

    
    deathlinkSection:"Death Link Stats",
    prestige:"Starting Values",
    runStats:"Time Stats",
}
const wonFormat={
    deathamn(n){
        return n+"x"
    },
    deathperc(n){
        return `${(n*100).toFixed(2)}%`
    },
    start2x(n){
        return `${n}:00`
    },
    prerace(n){return races[global.race.species].name},
    runTime(n){
        return n
    },
    runTimeActual(n,n2){
        let days = (n2 * 60 * 60) / 5;
        let not2 = n - days;

        let times = (not2 < 0 ? days / 2 : not2 + days / 2) * 5; // in seconds

        console.log(days, not2, times);

        let hours = Math.floor(times / 3600);
        let remaining = times % 3600;
        let minutes = Math.floor(remaining / 60);
        let seconds = remaining % 60;

        // Format with leading zeros
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
}
// const determineIfSeen={
//     deathlinkSection(){return global.opts.deathlink?true:false;}
// }
export function setupWon(){
    let won=$(`#mTabWon`)
    won.append(`<div class="tabWon_stats" id="tabWonStats"></div>`)
    won=$(`#tabWonStats`)
    console.log(global.opts.goal)
    won.append(`<span class="has-text-success">Congratulations! You have won the game! </span><div class="has-text-success tabWonGoal">You managed to <b>${stringPack[global.opts.goal]}</b>!</div>`)
    won.append(`<div id="wonPanel" class="vb"></div>`)
    console.log("eepy")
    let wonpan=$(`#mTabWon #wonPanel`)
    const sections={"prestige":["plasmid","phage","antip","start2x","prerace","relig","govnr"],"deathlinkSection":["deathlink","deathamn","deathperc","deathsTot","deathsCaused","deathsTrig"],"runStats":["runTime","runTimeActual"]}
    const alwaysVis=["deathlink"]
    for(let i in sections){
        wonpan.append(`<div class="has-text-success wonPanelTitle">${stringPack[i]}</div>`)
        // let subs=$(`#wonPanel #${i}`)
        for(let j in sections[i]){
            let cs=sections[i][j]
            let inp=""
            if(wonFormat[cs]){
                if(cs=="runTimeActual"||cs=="runTime"){
                    inp=`specFormat(time,'${cs}',s.start2x)`
                }
                else{
                    inp=`specFormat(s.${cs},'${cs}')`
                }
            }
            else{
                inp=`format(s.${cs})`
            }//${!alwaysVis.includes(j)?' v-if="s.deathlink"':''}
            console.log(inp,cs)
            wonpan.append(`<div>
                <span class="has-text-warning wonPanelSub">${stringPack[cs]}:</span> {{${inp}}}
                </div>`)
        }
    }
    console.log("done")
    // for(let i in global.ap_stats){
    //     let cst=global.ap_stats[i]
    //     let inp=""
    //     if(wonFormat[i]){
    //         inp=`specFormat(s.${i},'${i}')`
    //     }
    //     else{
    //         inp=`format(s.${i})`
    //     }
    //     won.append(`<div>
    //         <span class="has-text-warning">${stringPack[i]}:</span> {{${inp}}}
    //         </div>`)
    // }
    vBind({
        el: '#wonPanel',
        data: {
            s: global.ap_stats,
            time:global.stats.days,
        },
        methods:{
            format(s){
                if(s===false){s="No"}
                else if(s===true){s="Yes"}
                console.log(s)
                return s.toLocaleString();
            },
            specFormat(s,n,s2){
                console.log(s,n,s2)
                return wonFormat[n](s,s2).toLocaleString()
            }

        },
        filters: {
                        
        }
    });
    // won.append(``)
}

//have we reached out goal?
export function reachedGoal(){
    global.settings.reachedGoal=true;
    messageQueue("You did it! Congratulations!","arch",false,["all"])
    client.goal();
}

const devSaveFile="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"


// game sent RoomInfo
// client GetDataPackage games:[yachtDice]
// server GetDataPackage data:{games:{yachtdice:{checksum?,item_name_to_id,location_name_to_id}}}
// client connect
// serevr connected checkedLoc, missing loc
//     recieveditems items[{itemid,locationid,playerid,flags,class}]
// client Set?
// client setNotify
// client Get read client status
// server printJson joined
// server printJson help message
// server retrieved (from get)
// serer retrieved (from get)
// server retrieved from get
// client locationScout locatonID
// server locationInfo locations:[itemID,locationID from scout,player,flags,class]
// client locationChecks locid from locscout
// sevre printJson found item
// server recievedItems itemfoundid locid from locscout
// server roomupdate locid form locscout
// client locscout locid
// server locinfo itemid locid from locscout

//  Could not access required locations for accessibility check. Missing: [loc-tech:steel, loc-tech:mad_science, loc-tech:electricity, loc-tech:industrialization, loc-tech:oil_well, loc-tech:uranium, loc-tech:arpa, loc-tech:rocketry, loc-tech:mad]
// All Placements:
// [(loc-tech:club, item-filler:prod_bonus), (loc-tech:wooden_tools, item-filler:prod_bonus), (loc-tech:sundial, item-filler:plasmid_1), (loc-tech:housing, item-filler:antiplasmid_1), (loc-tech:agriculture, item-trap:prod_malus), (loc-tech:mining, item-filler:resources), (loc-tech:stone_axe, item-filler:plasmid_1), (loc-tech:currency, item-filler:resources), (loc-tech:irrigation, item-filler:phage_1), (loc-tech:science, item-trap:attack), (loc-tech:metal_working, item-filler:resources), (loc-tech:storage, item-crispr:birth_1), (loc-tech:garrison, item-filler:resources), (loc-tech:banking, item-filler:plasmid_3), (loc-tech:farm_house, item-crispr:ancients_3), (loc-tech:copper_axes, item-crispr:ancients_5), (loc-tech:copper_sledgehammer, item-filler:antiplasmid_1), (loc-tech:foundry, item-filler:power_bonus), (loc-tech:copper_pickaxe, item-filler:resources), (loc-tech:copper_hoe, item-trap:prod_malus), (loc-tech:government, item-filler:resources), (loc-tech:iron_mining, item-filler:pop_bonus), (loc-tech:silo, item-crispr:ancients_6), (loc-tech:bows, item-filler:resources), (loc-tech:armor, item-trap:prod_malus), (loc-tech:cement, item-filler:building), (loc-tech:loc-tech:investing, item-filler:prod_bonus), (loc-tech:spy, item-trap:attack), (loc-tech:artisans, item-crispr:crafty_3), (loc-tech:market, item-filler:building), (loc-tech:iron_axes, item-crispr:creep_3), (loc-tech:iron_sledgehammer, item-filler:resources), (loc-tech:iron_pickaxe, item-filler:resources), (loc-tech:iron_saw, item-filler:pop_bonus), (loc-tech:iron_hoe, item-filler:power_bonus), (loc-tech:smelting, item-filler:pop_bonus), (loc-tech:coal_mining, item-filler:phage_3), (loc-tech:mercs, item-filler:building), (loc-tech:republic, item-filler:resources), (loc-tech:socialist, item-trap:attack), (loc-tech:library, item-filler:plasmid_2), (loc-tech:theatre, item-filler:resources), (loc-tech:theology, item-crispr:store_4), (loc-tech:urban_planning, item-filler:prod_bonus), (loc-tech:reinforced_shed, item-filler:prod_bonus), (loc-tech:containerization, item-filler:prod_bonus), (loc-tech:apprentices, item-filler:resources), (loc-tech:rebar, item-filler:power_bonus), (loc-tech:plate_armor, item-filler:building), (loc-tech:cottage, item-filler:building), (loc-tech:vault, item-filler:power_bonus), (loc-tech:trade, item-filler:phage_3), (loc-tech:black_powder, item-trap:resources), (loc-tech:steel, item-filler:building), (loc-tech:mill, item-filler:power_bonus), (loc-tech:playwright, item-filler:resources), (loc-tech:thesis, item-filler:plasmid_3), (loc-tech:theocracy, item-crispr:enhance_1), (loc-tech:anthropology, item-trap:attack), (loc-tech:tax_rates, item-trap:resources), (loc-tech:aphrodisiac, item-filler:plasmid_1), (loc-tech:bayer_process, item-filler:building), (loc-tech:dynamite, item-filler:phage_1), (loc-tech:bonds, item-filler:power_bonus), (loc-tech:carpentry, item-filler:plasmid_4), (loc-tech:flintlock_rifle, item-filler:building), (loc-tech:reinforced_crates, item-filler:resources), (loc-tech:steel_rebar, item-crispr:store_1), (loc-tech:mad_science, item-trap:attack), (loc-tech:steel_sledgehammer, item-trap:resources), (loc-tech:steel_containers, item-filler:pop_bonus), (loc-tech:steel_axes, item-filler:antiplasmid_2), (loc-tech:steel_pickaxe, item-filler:phage_2), (loc-tech:steel_saw, item-filler:resources), (loc-tech:steel_beams, item-filler:antiplasmid_2), (loc-tech:steel_hoe, item-trap:resources), (loc-tech:blast_furnace, item-filler:resources), (loc-tech:research_grant, item-filler:antiplasmid_1), (loc-tech:hospital, item-filler:resources), (loc-tech:mythology, item-filler:building), (loc-tech:large_trades, item-filler:resources), (loc-tech:steel_vault, item-filler:power_bonus), (loc-tech:espionage, item-trap:resources), (loc-tech:magic, item-filler:antiplasmid_1), (loc-tech:boot_camp, item-filler:resources), (loc-tech:master_crafter, item-filler:plasmid_1), (loc-tech:electricity, item-trap:prod_malus), (loc-tech:barns, item-filler:plasmid_2), (loc-tech:diplomacy, item-filler:plasmid_2), (loc-tech:bessemer_process, item-filler:phage_1), (loc-tech:home_safe, item-filler:resources), (loc-tech:spy_training, item-filler:resources), (loc-tech:archaeology, item-filler:power_bonus), (loc-tech:apartment, item-filler:building), (loc-tech:radio, item-crispr:trader_2), (loc-tech:mine_conveyor, item-filler:phage_1), (loc-tech:cranes, item-crispr:store_2), (loc-tech:eebonds, item-filler:prod_bonus), (loc-tech:brickworks, item-filler:phage_2), (loc-tech:gantry_cranes, item-filler:plasmid_2), (loc-tech:jackhammer, item-trap:attack), (loc-tech:industrialization, item-filler:prod_bonus), (loc-tech:spy_gadgets, item-filler:resources), (loc-tech:merchandising, item-filler:building), (loc-tech:corpocracy, item-filler:resources), (loc-tech:technocracy, item-crispr:crafty_1), (loc-tech:scientific_journal, item-filler:resources), (loc-tech:oil_well, item-filler:power_bonus), (loc-tech:zoning_permits, item-filler:resources), (loc-tech:vocational_training, item-crispr:governor_1), (loc-tech:signing_bonus, item-filler:resources), (loc-tech:portland_cement, item-filler:building), (loc-tech:corruption, item-filler:pop_bonus), (loc-tech:freight, item-crispr:creep_4), (loc-tech:titanium_axes, item-filler:power_bonus), (loc-tech:titanium_sledgehammer, item-filler:resources), (loc-tech:warehouse, item-trap:resources), (loc-tech:titanium_hoe, item-filler:building), (loc-tech:swiss_banking, item-trap:power_malus), (loc-tech:hunter_process, item-filler:pop_bonus), (loc-tech:oxygen_converter, item-filler:building), (loc-tech:rotary_kiln, item-filler:resources), (loc-tech:oil_depot, item-filler:pop_bonus), (loc-tech:machine_gun, item-filler:building), (loc-tech:adjunct_professor, item-filler:resources), (loc-tech:anfo, item-trap:attack), (loc-tech:wharf, item-filler:resources), (loc-tech:alloy_containers, item-filler:resources), (loc-tech:electronics, item-filler:plasmid_2), (loc-tech:titanium_crates, item-filler:building), (loc-tech:oil_power, item-filler:resources), (loc-tech:tesla_coil, item-filler:phage_2), (loc-tech:code_breakers, item-filler:plasmid_4), (loc-tech:thermomechanics, item-filler:building), (loc-tech:cameras, item-filler:resources), (loc-tech:machinery, item-filler:pop_bonus), (loc-tech:tv, item-filler:prod_bonus), (loc-tech:safety_deposit, item-crispr:trader_1), (loc-tech:jackhammer_mk2, item-filler:building), (loc-tech:assembly_line, item-filler:antiplasmid_1), (loc-tech:uranium, item-filler:prod_bonus), (loc-tech:screw_conveyor, item-filler:building), (loc-tech:bunk_beds, item-filler:resources), (loc-tech:kroll_process, item-filler:power_bonus), (loc-tech:electric_arc_furnace, item-filler:phage_3), (loc-tech:casino, item-filler:building), (loc-tech:massive_trades, item-crispr:ancients_4), (loc-tech:titanium_drills, item-filler:pop_bonus), (loc-tech:internet, item-filler:power_bonus), (loc-tech:wind_turbine, item-filler:prod_bonus), (loc-tech:uranium_storage, item-filler:power_bonus), (loc-tech:fission, item-filler:resources), (loc-tech:dazzle, item-filler:plasmid_1), (loc-tech:bioscience, item-trap:prod_malus), (loc-tech:alloy_drills, item-filler:phage_2), (loc-tech:arpa, item-filler:building), (loc-tech:uranium_ash, item-filler:prod_bonus), (loc-tech:polymer, item-filler:building), (loc-tech:gmfood, item-filler:resources), (loc-tech:urbanization, item-filler:resources), (loc-tech:stock_market, item-trap:resources), (loc-tech:genetics, item-crispr:creep_2), (loc-tech:rocketry, item-filler:building), (loc-tech:monument, item-filler:building), (loc-tech:fracking, item-filler:plasmid_1), (loc-tech:kevlar, item-filler:resources), (loc-tech:fluidized_bed_reactor, item-filler:prod_bonus), (loc-tech:synthetic_fur, item-filler:building), (loc-tech:mad, item-filler:antiplasmid_2), (loc-tech:robotics, item-filler:antiplasmid_1), (loc-tech:cnc_machine, item-crispr:governor_2), (loc-build:basic_housing, item-trap:resources), (loc-build:cottage, item-filler:building), (loc-build:apartment, item-filler:prod_bonus), (loc-build:farm, item-filler:power_bonus), (loc-build:mill, item-filler:building), (loc-build:windmill, item-filler:plasmid_1), (loc-build:silo, item-filler:prod_bonus), (loc-build:garrison, item-filler:building), (loc-build:hospital, item-filler:phage_1), (loc-build:boot_camp, item-filler:resources), (loc-build:shed, item-filler:phage_3), (loc-build:storage_yard, item-filler:resources), (loc-build:warehouse, item-filler:building), (loc-build:bank, item-filler:building), (loc-build:lumber_yard, item-filler:resources), (loc-build:sawmill, item-filler:resources), (loc-build:rock_quarry, item-filler:pop_bonus), (loc-build:cement_plant, item-filler:antiplasmid_2), (loc-build:foundry, item-filler:building), (loc-build:factory, item-crispr:creep_5), (loc-build:smelter, item-crispr:store_3), (loc-build:metal_refinery, item-filler:pop_bonus), (loc-build:mine, item-crispr:creep_1), (loc-build:coal_mine, item-filler:resources), (loc-build:oil_well, item-filler:pop_bonus), (loc-build:oil_depot, item-filler:resources), (loc-build:trade, item-crispr:governor_3), (loc-build:wharf, item-filler:power_bonus), (loc-build:amphitheatre, item-trap:resources), (loc-build:casino, item-crispr:queue_2), (loc-build:temple, item-filler:resources), (loc-build:university, item-filler:plasmid_2), (loc-build:library, item-filler:resources), (loc-build:wardenclyffe, item-filler:resources), (loc-build:biolab, item-filler:prod_bonus), (loc-build:coal_power, item-crispr:transcendence_1), (loc-build:oil_power, item-filler:phage_1), (loc-build:fission_power, item-filler:building), (loc-build:stock_exchange, item-filler:building), (loc-build:launch_facility, item-filler:resources), (loc-build:monument, item-crispr:crafty_2), (loc-build:railway, item-filler:resources), (loc-build:lhc, item-trap:power_malus), (Missles Launched, Victory)]
// Press enter to close.