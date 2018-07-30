
export module Casts {

  export let stringToBoolean: (s: string) => boolean = (s) => {
    return JSON.parse(s);
  }

}