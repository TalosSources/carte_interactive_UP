import React from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

const StyledInvolved = styled.div`
    flex: 1;
    height: 100%;
    max-width: 400px;
    background-color: green;
    border-radius: 0.5rem;
    border: 2px solid lightgray;
    color: white;
    padding: 1rem;

    h3 {
        font-weight: bold;
    }
    
    .ingress {
        font-weight: bold;
    }
`

function GetInvolved (): React.JSX.Element {
  const { t } = useTranslation()
  return <StyledInvolved>
        <h3>{t('ui.supportTheMap.headline')}</h3>
        <p>
            <span className="ingress">{t('ui.supportTheMap.firstSentence')} </span>
            {t('ui.supportTheMap.body')}
        </p>
        <button type="button" className="btn btn-success bg-lightgreen text-white">{t('ui.supportTheMap.button')}</button>
    </StyledInvolved>
}

export default GetInvolved
