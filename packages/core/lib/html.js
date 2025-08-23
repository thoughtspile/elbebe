export function html(strings, ...interpolations) {
  let result = strings[0];
  for (let i = 1; i < strings.length; i++) {
      result += processInterpolation(interpolations[i - 1]);
      result += strings[i];
  }
  return result;
}

function processInterpolation(param) {
    if (Array.isArray(param)) {
        return param.join('');
    }
    if (param == null) {
        return '';
    }
    return String(param);
}
