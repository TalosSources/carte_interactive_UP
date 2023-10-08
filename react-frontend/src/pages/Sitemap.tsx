import React, { useState, useEffect } from 'react'
import { type Tag } from '../KesApi'

function renderTags (tags: Tag[]): React.JSX.Element[] {
  return tags.map(
    (tagElement) => (
              <li key={tagElement.slug}>
                  <a href={`/tag/${tagElement.slug}`}>{tagElement.title}</a>
              </li>
    )
  )
}

function Sitemap (): React.JSX.Element {
  const backendUrl = process.env.REACT_APP_BACKEND_URL ?? ''
  const tagApiUrl = `${backendUrl}/tags/`
  const [tags, setTags] = useState([])

  useEffect(() => {
    fetch(tagApiUrl)
      .then(async response => await response.json())
      .then(responseJson => {
        console.log('response_json:')
        console.log(responseJson)
        setTags(responseJson)
      })
      .catch(() => {
        console.log('Error while fetching tags in sitemap')
      })
  }, [])

  return (
        <div>
            <h2>Sitemap</h2>
            <h3>All tags</h3>
            <ul>
                {renderTags(tags)}
            </ul>
        </div>
  )
}

export default Sitemap
