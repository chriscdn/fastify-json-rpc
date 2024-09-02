import e from"isobject";import r from"is-function";import t from"fastify-plugin";function o(e){return o=Object.setPrototypeOf?Object.getPrototypeOf.bind():function(e){return e.__proto__||Object.getPrototypeOf(e)},o(e)}function n(){try{var e=!Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],function(){}))}catch(e){}return(n=function(){return!!e})()}function i(e,r){return i=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(e,r){return e.__proto__=r,e},i(e,r)}function s(e){var r="function"==typeof Map?new Map:void 0;return s=function(e){if(null===e||!function(e){try{return-1!==Function.toString.call(e).indexOf("[native code]")}catch(r){return"function"==typeof e}}(e))return e;if("function"!=typeof e)throw new TypeError("Super expression must either be null or a function");if(void 0!==r){if(r.has(e))return r.get(e);r.set(e,t)}function t(){return function(e,r,t){if(n())return Reflect.construct.apply(null,arguments);var o=[null];o.push.apply(o,r);var s=new(e.bind.apply(e,o));return t&&i(s,t.prototype),s}(e,arguments,o(this).constructor)}return t.prototype=Object.create(e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}}),i(t,e)},s(e)}var c={PARSEERROR:{code:-32700,message:"Parse error"},INVALIDREQUEST:{code:-32600,message:"Invalid Request"},METHODNOTFOUND:{code:-32601,message:"Method not found"},INVALIDPARAMS:{code:-32602,message:"Invalid params"},INTERNALERROR:{code:-32603,message:"Internal error"}},a=/*#__PURE__*/function(e){function r(r,t,o){var n;return void 0===r&&(r=c.INTERNALERROR.message),void 0===t&&(t=null),void 0===o&&(o=c.INTERNALERROR.code),"string"!=typeof r?((n=e.call(this,r.message)||this).code=void 0,n.data=void 0,n.code=r.code,n.data=r.data):((n=e.call(this,r)||this).code=void 0,n.data=void 0,n.code=o,n.data=t),function(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}(n)}var t,o;return o=e,(t=r).prototype=Object.create(o.prototype),t.prototype.constructor=t,i(t,o),r}(/*#__PURE__*/s(Error)),u=function(e,r){return r instanceof a||(r=new a(c.INTERNALERROR,{internal:r.message})),{jsonrpc:"2.0",error:{code:r.code,data:r.data,message:r.message},id:e}},p=function(t,o,n,i){try{var s=i.method,a=i.id,p=i.params,d=n[s];return"2.0"!=i.jsonrpc||null==s?Promise.resolve(u(a,c.INVALIDREQUEST)):!p||e(p)||Array.isArray(p)?r(d)?Promise.resolve(function(e,r){try{var o=Promise.resolve(d.call(n,{params:p,logger:t.log})).then(function(e){return function(e,r){return{jsonrpc:"2.0",result:r,id:e}}(a,e)})}catch(e){return r(e)}return o&&o.then?o.then(void 0,r):o}(0,function(e){return console.log(e),u(a,e)})):Promise.resolve(u(a,c.METHODNOTFOUND)):Promise.resolve(u(a,c.INVALIDREQUEST))}catch(e){return Promise.reject(e)}},d=t(function(e,r,t){e.addSchema({$id:"json-rpc-request-body",type:"object",properties:{jsonrpc:{type:"string",enum:["2.0"]},method:{type:"string"},params:{oneOf:[{type:"object"},{type:"array"}]},id:{anyOf:[{type:"integer"},{type:"string"},{type:"null"}]}},required:["jsonrpc","method"]}),e.addSchema({$id:"json-rpc-response",type:"object",properties:{jsonrpc:{type:"string",enum:["2.0"]},result:{type:"string"},error:{type:"object"},id:{anyOf:[{type:"integer"},{type:"string"},{type:"null"}]}},oneOf:[{type:"object",required:["jsonrpc","id","result"]},{type:"object",required:["jsonrpc","id","error"]}]}),e.decorate("rpcify",function(r,t){e.post(r,{schema:{description:"A JSON-RPC interface using POST.",params:{type:"object"},body:{oneOf:[{$ref:"json-rpc-request-body#"},{type:"array",items:{$ref:"json-rpc-request-body#"}}]},response:{200:{oneOf:[{$ref:"json-rpc-response#"},{type:"array",items:{$ref:"json-rpc-response#"}}]}}},handler:function(e,r){try{var o=e.body;if(Array.isArray(o)){var n=r.send;return Promise.resolve(Promise.all(o.map(function(r){return p(e,0,t,r)}))).then(function(e){return n.call(r,e)})}if("2.0"===(null==(s=o)?void 0:s.jsonrpc)&&Boolean(null==s?void 0:s.method)){var i=r.send;return Promise.resolve(p(e,0,t,o)).then(function(e){return i.call(r,e)})}return Promise.resolve(r.send(u(null,c.PARSEERROR)))}catch(e){return Promise.reject(e)}var s}})}),t()});export{a as CustomError,c as ErrorCodes,d as fastifyPlugin};
//# sourceMappingURL=fastify-json-rpc.module.js.map