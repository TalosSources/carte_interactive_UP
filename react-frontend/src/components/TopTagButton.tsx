import type React from 'react'
import styled from 'styled-components'

const StyledButton = styled.button`
    min-width: 100px;
    width: fit-content;
    block-size: fit-content;
    max-height: 3rem;
    white-space: nowrap;
    text-overflow: ellipsis;
`

function TopTagButton ({ title, onClick, active }: { title: string, onClick: (e: React.MouseEvent<HTMLButtonElement>) => void, active: boolean }): React.JSX.Element {
  return (
        <StyledButton
        type="button"
        className={`btn mr-2 mt-2 ${active ? 'btn-success' : 'bg-secondary text-light'}`}
        style={{ minWidth: title.length > 15 ? '230px' : '150px' }} // Not really a great solution
        onClick={onClick}>
        <span></span>{title}
    </StyledButton>
  )
}

export default TopTagButton
