// # explained : private field of a class
//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_properties
// Default option settings
const defaultOptions = {
    baseLayers: null,
    overLayers: null,
    opacityControl: false,
    collapsed: false,
};

export class OpacityControl {
    #map;
    #container;
    #divColl;
    #baseLayersOption;
    #overLayersOption;
    #opacityControlOption;
    #collapsedOption;
    #readedJson = {};
    //#readedJson;

    constructor(options) {
        // Option settings        
        this.#baseLayersOption = options.baseLayers || defaultOptions.baseLayers;
        this.#overLayersOption = options.overLayers || defaultOptions.overLayers;
        this.#opacityControlOption = options.opacityControl || defaultOptions.opacityControl;
        this.#collapsedOption = options.collapsed || defaultOptions.collapsed;
    }

    // Return [layerId, def] pairs from an options object, sorted by def.order
    #sortedEntries(optionObj) {
        return Object.entries(optionObj).sort((a, b) => (a[1].order ?? 0) - (b[1].order ?? 0));
    }

    // Create radio button
    #radioButtonControlAdd(layerId, type) {
        // Add radio button
        const radioButton = document.createElement('input');
        radioButton.setAttribute('type', 'radio');
        radioButton.id = layerId;
        // Initial layer definition
        //baseLayerOption : define a const in layers.js and then parse as option to constructor
        const initLayer = this.#sortedEntries(this.#baseLayersOption)[0]?.[0];
        // Show initial layer only
        if (layerId === initLayer) {
            radioButton.checked = true;
            if (type !== 'group') { this.#map.setLayoutProperty(layerId, 'visibility', 'visible'); }
            else if (type === 'group') { this.#setVis(this.#readedJson[layerId], 'visible'); }
        } else {
            radioButton.checked = false;
            if (type !== 'group') { this.#map.setLayoutProperty(layerId, 'visibility', 'none') }//;console.log(layerId)}
            else if (type === 'group') { this.#setVis(this.#readedJson[layerId], 'none'); }
        }
        //this.#container.appendChild(radioButton);        
        this.#divColl.appendChild(radioButton);
        //radio button event
        radioButton.addEventListener('change', (event) => {
            // Selected layer display
            event.target.checked = true;
            if (this.#baseLayersOption[layerId].typeLayer !== 'group') this.#map.setLayoutProperty(layerId, 'visibility', 'visible');
            else if (this.#baseLayersOption[layerId].typeLayer === 'group') { this.#setVis(this.#readedJson[layerId], 'visible'); }
            // Hide all but selected layers
            Object.keys(this.#baseLayersOption).map((layer) => {
                if (layer !== event.target.id) {
                    document.getElementById(layer).checked = false;
                    if (this.#baseLayersOption[layer].typeLayer !== 'group') this.#map.setLayoutProperty(layer, 'visibility', 'none');
                    else if (this.#baseLayersOption[layer].typeLayer === 'group') { this.#setVis(this.#readedJson[layer], 'none'); }
                }
            });
        }); //end of radio event

        // Add layer name
        const layerName = document.createElement('label');
        layerName.htmlFor = layerId;
        layerName.appendChild(document.createTextNode(layerId));
        //this.#container.appendChild(layerName);
        this.#divColl.appendChild(layerName);
    }

    // Create checkbox
    #checkBoxControlAdd(layerId, type) {
        // Add checkbox
        const checkBox = document.createElement('input');
        checkBox.setAttribute('type', 'checkbox');
        checkBox.id = layerId;
        // Hide all layers
        if (type !== 'group') { this.#map.setLayoutProperty(layerId, 'visibility', 'none'); }
        else if (type === 'group') {
            this.#setVis(this.#readedJson[layerId], 'none');
        }
        //this.#container.appendChild(checkBox);
        this.#divColl.appendChild(checkBox);
        //check first element  if there is not baselayers and is the first element in overlayers       
        const firstOverKey = this.#sortedEntries(this.#overLayersOption)[0]?.[0];
        if ((Object.keys(this.#baseLayersOption).length < 1) && (firstOverKey === layerId)) {
            checkBox.checked = true;
            if (type != "group") {
                this.#map.setLayoutProperty(layerId, 'visibility', 'visible');
            } else if (type == 'group') { this.#setVis(this.#readedJson[layerId], 'visible'); }
        }

        // checkbox event
        checkBox.addEventListener('change', (event) => {
            //console.log('changed',event)            
            // Show/hide layers
            if (event.target.checked) {
                if (this.#overLayersOption[layerId].typeLayer !== 'group') { this.#map.setLayoutProperty(layerId, 'visibility', 'visible'); }
                else if (this.#overLayersOption[layerId].typeLayer === 'group') { this.#setVis(this.#readedJson[layerId], 'visible'); }
            } else {
                if (this.#overLayersOption[layerId].typeLayer !== 'group') { this.#map.setLayoutProperty(layerId, 'visibility', 'none'); }
                else if (this.#overLayersOption[layerId].typeLayer === 'group') { this.#setVis(this.#readedJson[layerId], 'none'); }
            }
        });

        //Add layer name
        const layerName = document.createElement('label');
        layerName.htmlFor = layerId;
        layerName.appendChild(document.createTextNode(this.#overLayersOption[layerId].label));
        //this.#container.appendChild(layerName);
        this.#divColl.appendChild(layerName);
    }

    // Create slide bar
    #rangeControlAdd(layerId, type) {
        // Add slide bar
        const range = document.createElement('input');
        range.type = 'range';
        range.min = 0;
        range.max = 100;
        range.value = 100;
        //this.#container.appendChild(range);
        this.#divColl.appendChild(range);
        // slide birth event
        range.addEventListener('input', (event) => {
            // Transparency settings
            const opacityValue = Number(event.target.value / 100);
            this.#setOp(layerId, this.#overLayersOption[layerId].typeLayer, opacityValue)
            this.#map.redraw();
        });
    }



    // Control creation
    #opacityControlAdd() {
        // container creation
        this.#container = document.createElement('div');
        this.#container.className = 'maplibregl-ctrl maplibregl-ctrl-group';
        this.#container.id = 'opacity-control';
        //button collapse
        const butLayers = document.createElement('button')
        butLayers.class = 'butLayersClass'
        butLayers.id = 'butLayers'
        butLayers.onclick = function () {
            var x = document.getElementById('divColl');
            if (x.style.display === "none") {
                x.style.display = "block";
            } else {
                x.style.display = "none";
            }
        }
        //collapsable div with button 
        this.#container.appendChild(butLayers);
        //collapsable div 
        this.#divColl = document.createElement('div');
        this.#divColl.id = 'divColl';
        if (this.#collapsedOption) {
            this.#divColl.style.display = "none";
        } else {
            this.#divColl.style.display = "block";
        }

        this.#container.appendChild(this.#divColl);
        // Base layer settings
        if (this.#baseLayersOption) {
            //process base layers in "order" sequence
            this.#sortedEntries(this.#baseLayersOption).forEach(([layerId, def]) => {
                const type = def.typeLayer;
                //if group,read json from options,and store in #readedJson
                if (type === 'group') { this.#readedJson[layerId] = this.#readJson(def.style); }
                const br = document.createElement('br');
                // Create radio button
                this.#radioButtonControlAdd(layerId, type);
                //this.#container.appendChild(br);
                this.#divColl.appendChild(br);
            });
        }
        // separator line
        if ((Object.keys(this.#baseLayersOption).length > 0) && Object.keys(this.#overLayersOption).length) {
            //console.log(this.#baseLayersOption.length,Object.keys(this.#baseLayersOption).length)
            const hr = document.createElement('hr');
            //this.#container.appendChild(hr);
            this.#divColl.appendChild(hr);
        }
        // Overlayer settings
        if (this.#overLayersOption) {
            //process over layers in "order" sequence
            this.#sortedEntries(this.#overLayersOption).forEach(([layerId, def]) => {
                const type = def.typeLayer;
                //if group,read json from options,and store in #readedJson
                if (type === 'group') {
                    this.#readedJson[layerId] = this.#readJson(def.style);
                }
                const br = document.createElement('br');
                // Create checkbox                
                this.#checkBoxControlAdd(layerId, type);
                //this.#container.appendChild(br);
                this.#divColl.appendChild(br);
                // Create slide bar
                if (this.#opacityControlOption) {
                    this.#rangeControlAdd(layerId, type);
                    //this.#container.appendChild(br);
                    this.#divColl.appendChild(br);
                }
            });
        }

    }

    onAdd(map) {
        this.#map = map;
        // Control creation
        this.#opacityControlAdd();
        return this.#container;
    }

    onRemove() {
        this.#container.parentNode.removeChild(this.#container);
        this.#map = null;
    }
    //parseJson
    #readJson(jsonUri) {
        var stylej;
        if (typeof jsonUri == 'string') {
            var request = new XMLHttpRequest();
            request.open("GET", jsonUri, false);
            request.send(null);
            if (request.readyState === 4 && request.status === 200) {
                var stylej = JSON.parse(request.responseText);
                return stylej;
            }
        } else if (typeof jsonUri == 'object') {
            var stJson = JSON.stringify(jsonUri)
            var stylej = JSON.parse(stJson)
            return stylej
        }
    };
    //Set visibility
    #setVis(parsedJson, v_visibility = 'none') {
        for (const num in parsedJson.layers) {
            map.setLayoutProperty(parsedJson.layers[num].id, 'visibility', v_visibility)
            if (parsedJson.layers[num].layout !== undefined &&
                parsedJson.layers[num].layout.visibility == 'none') {  //ensure none visibility
                map.setLayoutProperty(parsedJson.layers[num].id, 'visibility', 'none')
            }
        }
    }
    //Set opacity
    #setOp(layerId, type, v_opacity) {

        var opacityType = ""
        if (type == "group") {
            var layers = this.#readedJson[layerId].layers;
            for (const num in layers) {     //iterate at readedJson,and pass to setOp
                const opTypeLay = (layers[num].type)                
                if (opTypeLay == "symbol") {
                    //console.log(layers[num].id)                    
                    opacityType = 'text';
                    //console.log(`Layer ${layers[num].id} type ${opTypeLay} `)                    
                    var p_opacity = this.#getPrevOpac(layers[num].id, opacityType);
                    this.#setOp(layers[num].id, opacityType, v_opacity * p_opacity);
                    opacityType = 'icon';
                    //console.log(`Layer ${layers[num].id} type ${opTypeLay} `)                    
                    p_opacity = this.#getPrevOpac(layers[num].id, opacityType);
                    this.#setOp(layers[num].id, opacityType, v_opacity * p_opacity);
                }
                else if (opTypeLay == "circle") {
                    //console.log(layers[num].id)
                    //console.log(`Layer ${layers[num].id} type ${opTypeLay} `)
                    opacityType = 'circle';
                    var p_opacity = this.#getPrevOpac(layers[num].id, opacityType);
                    this.#setOp(layers[num].id, opacityType, v_opacity * p_opacity);
                    //let newOp = v_opacity * p_opacity
                    //console.log(`opacityType ${opacityType} p_opacity ${p_opacity} setting to ${newOp}`)
                    opacityType = 'circle-stroke';
                    p_opacity = this.#getPrevOpac(layers[num].id, opacityType);
                    this.#setOp(layers[num].id, opacityType, v_opacity * p_opacity);
                    //newOp = v_opacity * p_opacity
                    //console.log(`opacityType ${opacityType} p_opacity ${p_opacity} setting to ${newOp}`)
                }
                else {
                    //console.log(`Layer ${layers[num].id} type ${opTypeLay}`);
                    var p_opacity = this.#getPrevOpac(layers[num].id, opTypeLay)
                    this.#setOp(layers[num].id, opTypeLay, v_opacity * p_opacity);
                }
            }
        }
        if (type == 'hillshade') {
            map.setPaintProperty(layerId, 'hillshade-exaggeration', v_opacity)
        }
        if (type != 'group' && type != 'hillshade') {
            if (!type.endsWith('-opacity')) {
                type = type + '-opacity'
            }
            try {
                map.setPaintProperty(layerId, type, v_opacity);
            } catch (e) {
                console.error(`FAILED setPaintProperty(${layerId}, ${type}, ${v_opacity})`, e.message);
            }
        }
    }
    #getPrevOpac(layerId, type) {
        const opacityType = type + '-opacity';
        let paint;
        let found = null;
        for (const groupKey in this.#readedJson) {
            found = this.#readedJson[groupKey].layers?.find(l => l.id === layerId);
            if (found) {
                paint = found.paint;
                break;
            }
        }
        const val = paint?.[opacityType];
        return typeof val === 'number' ? val : 1;
    }
}