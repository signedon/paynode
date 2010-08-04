var qs = require('querystring')
var s = require('sys')

var errorField = ['errorcode', 'shortmessage', 'longmessage', 'severitycode']
var balanceField = ['amt', 'currencycode']

var is = function(field){
  return function(s){
    return field.some(function(el){
      return s.indexOf(el) > -1;
    })
  }
}

var isListField = function(s){
  return s.search(/l_/) > -1
}
var isSpecialNestedField = function(s){
  return s.search(/_\d_/) > -1
}

function buildResponse(data){
  var lowercaseKeys = function(data){
    var result = {}
    Object.keys(data).forEach(function(k){
      result[k.toLowerCase()] = data[k]
    })
    return result
  }
  
  var buildFrom = function(fieldType, data){
      var obj = []
    Object.keys(data).filter(isListField)
      .filter(is(fieldType))
      .forEach(addNestedFields(obj, data))
    return obj
  }
  
  var addNestedFields = function(nestedFields, data){
    return function(prop){
        var index = prop.charAt(prop.length - 1),
            newKey =prop.replace(/^l_/, '').replace(/\d$/, '')
            
        if(nestedFields.length == index){
          nestedFields.push({})
        }
        nestedFields[index][newKey] = data[prop]
        delete data[prop]

      }
  }
  
  var newData = lowercaseKeys(qs.parse(data))
  if(newData.l_errorcode0){
    newData.errors = buildFrom(errorField, newData)
  }if(newData.l_amt0){
    newData.balances = buildFrom(balanceField, newData)
  }
  return buildAdditionalNestedFields(newData)
  
}

function buildAdditionalNestedFields(newData){
  Object.keys(newData).filter(isSpecialNestedField).forEach(function(field){
    var parts = field.split('_')
    var name = parts[0], index = parts[1], key = parts[2]
    if(!newData[name]) newData[name] = []
    if(!newData[name][index])newData[name][index] = {}
    newData[name][index][key] = newData[field]
    delete newData[field]
  })
  return newData
}

exports.parseResponse = buildResponse