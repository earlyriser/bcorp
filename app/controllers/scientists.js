import Ember from 'ember';

export default Ember.Controller.extend({
    apiAi:null,
    companies:null,
    parameters:{groupBy:null,xAxis:null},


  
  actions: {
    sectionChange() {
      console.log("change")
      this.set('model.section', 'dummy');
      
      this.set('model.companies', this.companies);
    },
  
    testClick() {
      console.log ( apiAi.isInitialise() );
      apiAi.open();
      console.log ( apiAi.isOpen() );
    },
        
    sendPhrase(){
      this.sendJson(this.query);
    },
    
    testFunction(){
      this.doSomething();
      
    }
  },
  
  
  
  doSomething: function(){
    this.apiAi.open();
  },
  
  sendJson: function (text) {      
      var queryJson = {
              "v": '20150910',
              "query": text,
              "timezone": "GMT+6",
              "lang": "en",
              "sessionId": this.sessionId
          };
      this.apiAi.sendJson(queryJson);
      
  },
  
  getSegmentData:function(data){
    console.log( data);
    var result = [];
    
    _.each(data, function(company){
      result.push([company.overall, company[this.xAxis]])
    }.bind(this));
    
    return result;
  },
  
  compareBy:function(compareFilter){
    console.log (compareFilter )
    var result = {groups:[], companies:this.model.companies};
    //category, country, city
    if( compareFilter){
      result.groups = _.uniq(_.map(this.model.companies, compareFilter)).sort();
      result.companies = _.groupBy(this.model.companies, compareFilter);
    }
    
    console.log ( result)
    return result;
  },
  
  updateSeries:function(){
    console.log ( this.parameters.bcorp_group)
    var compareObj = this.compareBy(this.parameters.groupBy)
    var result = [];
    var segments = compareObj.groups;
    
    if ( segments.length > 0){
      segments.forEach (function(segment){
        console.log ( segment);
        result.push({name:segment, data:this.getSegmentData( compareObj.companies[segment])})
      }.bind(this));
    }else{
      result.push({name:'All', data:this.getSegmentData( compareObj.companies)})
    }
    
    return result;
  },
  
  initChart: function(){    
    
    var series = this.updateSeries()
    var xAxis = this.parameters.xAxis;
    
    
    Highcharts.chart('container', {
         chart: {
             type: 'scatter',
             zoomType: 'xy'
         },
         title:{
             text:''
         },         
         xAxis: {
             title: {
                 enabled: true,
                 text: xAxis
             },
             startOnTick: true,
             endOnTick: true,
             showLastLabel: true
         },
         yAxis: {
             title: {
                 text: 'Overall score'
             }
         },
         legend: {
          enabled:false,
             layout: 'horizontal',
             verticalAlign: 'top',
             x: 0,
             y: 0,
             floating: true,
             backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF',
             borderWidth: 1
         },
         plotOptions: {
             scatter: {
                 marker: {
                     radius: 5,
                     states: {
                         hover: {
                             enabled: true,
                             lineColor: 'rgb(100,100,100)'
                         }
                     }
                 },
                 states: {
                     hover: {
                         marker: {
                             enabled: false
                         }
                     }
                 },
                 tooltip: {
                     headerFormat: '<b>{series.name}</b><br>',
                     pointFormat: 'Overall: {point.x}, '+xAxis+': {point.y}'
                 }
             }
         },
         series: series
     });    
  },
  
  
  init: function(){
    var SERVER_PROTO, SERVER_DOMAIN, SERVER_PORT, ACCESS_TOKEN, SERVER_VERSION, TTS_DOMAIN;

    SERVER_PROTO = 'wss';
    SERVER_DOMAIN = 'api-ws.api.ai';
    TTS_DOMAIN = 'api.api.ai';
    SERVER_PORT = '4435';
    ACCESS_TOKEN = '91acfa6995494adfa3fdf94f8196ec3d';
    SERVER_VERSION = '20150910';
    
    var that = this;

    this.query = "By country";
    this.sessionId = ApiAi.generateRandomId();
//    this.parameters = {};    
        
    var config = {
        server: SERVER_PROTO + '://' + SERVER_DOMAIN + ':' + SERVER_PORT + '/api/ws/query',
        serverVersion: SERVER_VERSION,
        token: ACCESS_TOKEN,// Use Client access token there (see agent keys).
        sessionId: this.sessionId,
        lang: 'en'
    };
    this.apiAi = new ApiAi(config);
  
    this.apiAi.onInit = function(){
        console.log("> ON INIT use config");
        this.apiAi.open();
    }.bind(this);
    
    this.apiAi.onEvent = function (code, data) {
        console.log("> ON EVENT", code, data);
        if(data.type==='open' && data.returnValue){
          console.log("something")
        }
    };
    
    this.apiAi.onResults = function (data) {
        console.log("> ON RESULT", data);

        var status = data.status,
            code,
            speech;

            if ( data.result.metadata.intentName=='display' && data.result.parameters){
              console.log (data.result.parameters )
              that.parameters.groupBy = data.result.parameters.bcorp_group;
              that.parameters.xAxis = data.result.parameters.bcorp_section;
              
              that.initChart();
            }
            
        if (!(status && (code = status.code) && isFinite(parseFloat(code)) && code < 300 && code > 199)) {
            //dialogue.innerHTML = JSON.stringify(status);
            

            return;
        }

    };
    
    this.apiAi.init();
    
    this.xAxis = 'community';
    
  }
    
});
