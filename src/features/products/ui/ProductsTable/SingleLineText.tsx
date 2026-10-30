import { Typography } from '@mui/material'

type SingleLineTextProps = {
  text: string
}

export function SingleLineText({ text }: SingleLineTextProps) {
  return (
    <Typography variant="body2" noWrap title={text}>
      {text}
    </Typography>
  )
}
