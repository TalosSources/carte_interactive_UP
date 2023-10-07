import type React from 'react'

interface PropTypes {
  children: string
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void
}

function OutlineButton ({ children, onClick }: PropTypes): React.JSX.Element {
  return (<button className="btn btn-outline-light ml-2" onClick={onClick} >{children}</button>)
}

export default OutlineButton
