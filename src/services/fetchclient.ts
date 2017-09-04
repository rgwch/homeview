import 'fetch'

const DEBUG=false
export class FetchClient{

  public async fetchJson(url){
      if(DEBUG) {
        return 42
      }else{
        let result = await fetch(url)
        return (await result.json()).val
      }
  }

}
