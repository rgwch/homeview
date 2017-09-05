import 'fetch'

const DEBUG=true
export class FetchClient{

  public async fetchJson(url){
      if(DEBUG) {
        return Math.round((Math.random()*40+20)*10)/10
      }else{
        let result = await fetch(url)
        return (await result.json()).val
      }
  }

}
