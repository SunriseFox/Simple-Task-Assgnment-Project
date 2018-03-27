const regex_email = /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/

const default_rules = {
  integer: ['应该是个整数', {func: (val) => {return Number.isInteger(Number(val))}}],
  gender: ['not a number between 0-3', {type: 'integer', min: 0, max: 3}],
  email: ['not a valid email address', {func: (val) => {return regex_email.test(val)}}],
  nickname:
    [
      '至少2个字符，不能以数字开头',
      {minLength: 2, maxLength: 20, func: (val) => { return /^[^0-9]\S+$/.test(val) && !regex_email.test(val)}}
    ],
  password: ['长度应在 6 - 16 之间', {minLength: 6, maxLength: 16}],
  student_id: ['长度应在 6 - 9 之间', {minLength: 6, maxLength: 9}],
  realname: ['应该是真实姓名', {minLength: 2, maxLength: 16}],
  msg: ['长度应在 3 - 140 字之间', {minLength: 3, maxLength: 140}]
}

const check_internel = (val, rule) => {
  if (rule.type && !check_internel(val, default_rules[rule.type][1])) return false
  if (val < rule.min || val > rule.max) return false
  if (val.length < rule.minLength || val.length > rule.maxLength) return false
  return !rule.func || rule.func(val)
}

const check = (keys, values, rules, form) => {
  const ret = {}
  if (!rules) rules = {}
  const length = keys.length
  for (let i = 0; i < length; i++) {
    const key = keys[i]
    let value = values[i]
    const rule = rules[i] || {}

    if (value === undefined) {
      if (rule.nonexist !== 'allow' && rule.empty !== 'remove')
        ret[key] = '未定义'
      continue
    }

    if (value === '') {
      switch (rule.empty) {
        case 'remove':
          values[i] = undefined
          continue
        case undefined:
        case 'error':
          ret[key] = '不能为空'
        // fall through
        case 'allow':
          continue
      }
    }

    if (value.length === 172 && rule.decrypt !== false) {
      const t = decrypt(value)
      if (t) value = t
    }

    if (rule.toLower)
      value = value.toLowerCase()

    const type = rule.type || key
    if (default_rules[type] !== undefined) {
      if (!check_internel(value, default_rules[type][1]))
        ret[key] = default_rules[type][0]
    }
    values[i] = value
    if (form) form[key] = value
  }
  return Object.keys(ret).length === 0 ? false : ret
}

module.exports = check
