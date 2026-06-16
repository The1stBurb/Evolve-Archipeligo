class HTMLDATA{
    constructor(){
        // this.div='div'
        // this.span='span'

    }
    HTML(name,args,children){
        return `<${name} ${this.parseInp(args)}>${this.parseInp(children)}</${name}>`
    }
    HTML_CHILDLESS(name,args){
        return `<${name} ${this.parseInp(args)}>`
    }
    ATTR(name,...args){
        return `${name}="${this.parseInp(args)}"`
    }
    div(args,children){
        return this.HTML('div',args,children)
    }
    span(args,children){
        return this.HTML('span',args,children)
    }
    b_tooltip(args,children){
        return this.HTML_CHILDLESS('b-tooltip',args,children)
    }
    p(args,children){
        return this.HTML('p',args,children)
    }
    h1(args,children){
        return this.HTML('h1',args,children)
    }
    h2(args,children){
        return this.HTML('h2',args,children)
    }
    h3(args,children){
        return this.HTML('h3',args,children)
    }
    h4(args,children){
        return this.HTML('h4',args,children)
    }
    a(args,children){
        return this.HTML('a',args,children)
    }
    button(args,children){
        return this.HTML('button',args,children)
    }
    input(args,children){
        return this.HTML('input',args,children)
    }
    ul(args,children){
        return this.HTML('ul',args,children)
    }
    li(args,children){
        return this.HTML('li',args,children)
    }
    b_tabs(args,children){
        return this.HTML('b-tabs',args,children)
    }
    b_tab_item(args,children){
        return this.HTML('b-tab-item',args,children)
    }
    // template(args,children){
    //     return this.HTML('template',args,children)
    // }
    b_button(args,children){
        return this.HTML('b-button',args,children)
    }
    b_dropdown(args,children){
        return this.HTML('b-dropdown',args,children)
    }
    b_field(args,children){
        return this.HTML('b-field',args,children)
    }
    b_numberinput(args,children){
        return this.HTML('b-numberinput',args,children)
    }
    b_checkbox(args,children){
        return this.HTML('b-checkbox',args,children)
    }
    b_radio_button(args,children){
        return this.HTML('b-radio-button',args,children)
    }
    i(args,children){
        return this.HTML('i',args,children)
    }
    form(args,children){
        return this.HTML('form',args,children)
    }
    hr(args){
        return this.HTML_CHILDLESS('hr',args)
    }
    b_switch(args,children){
        return this.HTML('b-switch',args,children)
    }
    b_input(args,children){
        return this.HTML('b-input',args,children)
    }
    b_collapse(args,children){
        return this.HTML('b-collapse',args,children)
    }
    b_slider(args,children){
        return this.HTML('b-slider',args,children)
    }
    b_icon(args,children){
        return this.HTML('b-icon',args,children)
    }
    b_radio(args,children){
        return this.HTML('b-radio',args,children)
    }
    //path,svg,progress

    class(...args){
        return this.ATTR('class',...args)
    }
    style(...args){
        return this.ATTR('style',...args)
    }
    id(...args){
        return this.ATTR('id',...args)
    }
    aria_hidden(...args){
        return this.ATTR('aria-hidden',...args)
    }
    click(...args){
        return this.ATTR('@click',...args)
    }
    slot(...args){
        return this.ATTR('slot',...args)
    }
    aria_label(...args){
        return this.ATTR('aria-label',...args)
    }
    v_on_click(...args){
        return this.ATTR('v-on:click',...args)
    }
    title(...args){
        return this.ATTR('title',...args)
    }
    v_show(...args){
        return this.ATTR('v-show',...args)
    }
    value(...args){
        return this.ATTR(':value',...args)
    }
    disabled(...args){
        return this.ATTR(':disabled',...args)
    }
    v_model(...args){
        return this.ATTR('v-model',...args)
    }
    controls(...args){
        return this.ATTR(':controls',...args)
    }
    input(...args){
        return this.ATTR('@input',...args)
    }
    aria_live(...args){
        return this.ATTR('aria-live',...args)
    }
    open(...args){
        return this.ATTR(':open',...args)
    }
    format(...args){
        return this.ATTR('format',...args)
    }
    aria_role(...args){
        return this.ATTR('aria-rle',...args)
    }
    scrollable(...args){
        return this.ATTR(':scrollable',...args)
    }
    aria_label(...args){
        return this.ATTR(':aria-label',...args)
    }
    role(...args){
        return this.ATTR('role',...args)
    }


    parseOneInp(value){
        return typeof value === "object" && value !== null && !Array.isArray(value)
    }
    parseInp(inp){
        if(typeof inp=="string"){
            return inp
        }
        else if(parseOneInp(inp)){//its a dictionary / json object
            let s=''
            for(let i in inp){
                s+=` ${i}="${inp[i]}"`
            }
            return s
        }
        else{//its a list ig
            return inp.join(' ')
        }
    }
}

function HTML(name,attr,children){
    let childrenText=children?`${children}</${name}>`:''
    let attrText=''
    for(let i in attr){
        if(attr[i]){
            attrText+=` ${i}="${attr[i]}"`
        }
        else{
            attrText+=` ${i}`
        }
        
    }
    return `<${name}${attrText}>${childrenText}`
}
console.log(HTML('div',{'class':'draw disp fun cool',':label':0},HTML(`hr`,{'style':'oopsy daisy lol'},'somehow')))