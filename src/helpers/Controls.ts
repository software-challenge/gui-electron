export function getValue(event: any) {
  let t = event.target
  return t.type == 'checkbox' ? t.checked : t.value
}

export function useValue(use: (value: any) => void): (event: any) => void {
  return function(event) {
    use(getValue(event))
  }
}