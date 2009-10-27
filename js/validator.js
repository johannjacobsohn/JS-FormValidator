/*
 * JS Form-Validator
 * 
 * @data url, email, required, number
 * @version 1.0
 */
validate = {
	options : {
		onError : function(form, faulty){
			if(document.getElementById("errorList")){ document.getElementById("errorList").parentNode.removeChild(document.getElementById("errorList"));}
			form.insertBefore(validate.formatErrorList(), form.childNodes[0]);
		},
		onSuccess : function(form){
			form.submit();
		},
		errorClass 		: "error",
		successClass 	: "success",
		defaultMsg 		: "There was an error."
	},
	data_model : {
		email : {
			pattern : /[a-z0-9\-_]?[a-z0-9.\-_]+[a-z0-9\-_]?@[a-z.-]+\.[a-z]{2,}/,
		},
		url : {
			pattern : /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
		},
		req : {
			required : true
		},
		number : {
			sanitary : /[0-9]*/,
			pattern : /^[0-9]*$/
		}
	},
	faulty : [],
	extend : function(new_data){
		for ( var rule in new_data ) {
			for ( var name in new_data[ rule ] ) {
				if(this.data_model[rule] === undefined) this.data_model[rule] = {};			
				if ( new_data[ rule ][ name ] !== undefined ) this.data_model[rule][name] = new_data[rule][name];
			}
		}
	},
	init : function(){
		forms = document.getElementsByTagName("form");
		for(n=0; n < forms.length; n++){
			addEvent(forms[n], 'submit', function(evt){
				validate.faulty = []; //reset faulty array
				stopDefault(evt); //prevent form submit
				isValid = true;
				
				//validate inputs
				inputs = this.getElementsByTagName("input");
				for(f=0; inputs.length > f; f++){
					if(inputs[f].type !== undefined){
						isValid = validate.evaluate(inputs[f]) && isValid;
					}
				}
				
				//validate selects
				selects = this.getElementsByTagName("select");
				for(f=0; selects.length > f; f++){
					if(selects[f].type !== undefined){
						isValid = validate.evaluate(selects[f]) && isValid;
					}
				}
				
				//validate textareas
				textareas = this.getElementsByTagName("textarea");
				for(f=0; textareas.length > f; f++){
					if(textareas[f].type !== undefined){
						isValid = validate.evaluate(textareas[f]) && isValid;
					}
				}

				if(isValid){	validate.options.onSuccess(this); }
				else{ validate.options.onError(this); }
			});
		}
	},
	formatErrorList : function(){
	
		ul = document.createElement("ul");
		ul.setAttribute("id", "errorList");
		for(i=0; i < this.faulty.length; i++){
			li = document.createElement("li");
			a = document.createElement("a");
			a.setAttribute("href", "#" + this.faulty[i].id);
			
			if(document.getElementById(this.faulty[i].id).title){
				errorStr = document.getElementById(this.faulty[i].id).title;
			} else if(this.data_model[this.faulty[i].errorClass] && this.data_model[this.faulty[i].errorClass].msg) {
				errorStr = this.data_model[this.faulty[i].errorClass].msg;
			} else {
				errorStr = this.options.defaultMsg;
			}
			a.appendChild(document.createTextNode(errorStr));
			li.appendChild(a);
			ul.appendChild(li);
		}
		return ul;
		
	},
	view : function(el, type, msg){
		var label;
		//find label, if any
		//first, look for explicit labels
		if(el.id){
			labels = document.getElementsByTagName("label");
			for(i=0; i<labels.length; i++){
				if(labels[i].attributes["for"] && labels[i].attributes["for"].nodeValue == el.id){
					label = labels[i];
					break;
				}
			}
		}
		//next, look for wrapping label
		if(!label){
			temp = el.parentNode;
			for(i=0;i<5; i++){
				if(temp.nodeName.toLowerCase() == "label"){
					label = temp;
					break;
				} else {
					temp = temp.parentNode;
				}
			}
		}
		
		if(type=="success"){
			removeClass(el, this.options.errorClass);
			removeClass(label, this.options.errorClass);

			//only not-empty values can be "correct"
			if(el.value != ""){
				addClass(el, this.options.successClass);
				addClass(label, this.options.successClass);
			}
			
			//Remove Errormessage
			errorlabel = document.getElementById(el.name + "-error");
			if(errorlabel){
				errorlabel.parentNode.removeChild(errorlabel);
			}
		} else if(type=="error") {
			removeClass(el, this.options.successClass);
			addClass(el, this.options.errorClass);
			
			removeClass(label, this.options.successClass);
			addClass(label, this.options.errorClass);
			
			//Add Errormessage
			if(msg && !document.getElementById(el.name + "-error")){
				span = document.createElement("span");
				span.setAttribute("id", el.name + "-error");
				span.setAttribute("class", "error-msg");
				span.appendChild(document.createTextNode(msg));
				label.appendChild(span);
			}
		}
	},
	evaluate : function(el){
		return_value = true;
		
		if(el.tagName.toLowerCase() == "select"){
			el.onchange = function(evt){ validate.evaluate(this); };
		}
		else if(el.type == "radio" || el.type == "checkbox"){
			el.onclick = function(evt){ validate.evaluate(this); };
		}
		else{
			el.onkeyup = function(evt){ validate.evaluate(this); };
		}
	
		el.id = el.id ? el.id : el.name + "-" + Math.round(Math.random() * 1000);
		
		var classes = new Array;
		classes = el.className.split(" ");
		for(j=0;j<classes.length && return_value;j++){
		
			if(/[\w]+/.test(classes[j]) && this.data_model[classes[j]]){

				//clean input
				if(!(!this.data_model[classes[j]].sanitary)){ 
					el.value = this.data_model[classes[j]].sanitary.exec(el.value)
				}
				
				//check if required
				if(!(!this.data_model[classes[j]].required) && !/[\w]+/.test(el.value)){ 
					this.faulty.push({
						id : el.id,
						type : "req",
						errorClass : classes[j]
					});					
					return_value = false;
				}

				//check pattern
				if(!(!this.data_model[classes[j]].pattern) && !this.data_model[classes[j]].pattern.test(el.value)){
					this.faulty.push({
						id : el.id,
						type : "pattern",
						errorClass : classes[j]
					});		
					return_value = false;
				}
				
				//check radioboxes
				if((el.type == "radio" || el.type == "checkbox") && !(!this.data_model[classes[j]].required)){
					
					inp = document.getElementsByTagName("input");
					checked = false;
					these_inputs = [];
					for(k = 0; k < inp.length; k++){
						if(inp[k].name == el.name){
						these_inputs.push(inp[k]);
							if(inp[k].checked){
								checked = true;
							}
						}
					}
					if(!checked){
						this.faulty.push({
							id : el.id,
							type : "checked",
							errorClass : classes[j]
						});		
						return_value = false;
					}
				}
				
				//display errors
				if((el.type == "radio" || el.type == "checkbox") && these_inputs){
					for(k = 0; k < these_inputs.length; k++){
						this.view(these_inputs[k], return_value ? "success" : "error", this.data_model[classes[j]] ? this.data_model[classes[j]].msg : "");	
					}
				} else { 
					this.view(el, return_value ? "success" : "error", this.data_model[classes[j]] ? this.data_model[classes[j]].msg : "");
				}
			}
		}
		
		return return_value;
	}
};

//initiate form validator
addEvent(window,"load",function(){
	validate.init();
});