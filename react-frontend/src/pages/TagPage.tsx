import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { renderCardCollection } from '../components/Cards'
import { fetchTags, type Tag, useInitiatives } from '../lib/KesApi'

function TagPage (): React.JSX.Element {
  const { tagId: tagSlug } = useParams()

  const [tags, setTags] = useState<Tag[]>([])
  const initiatives = useInitiatives()

  useEffect(() => {
    fetchTags()
      .then(responseJson => {
        setTags(responseJson)
      })
      .catch(() => {
        console.log('Error while fetching tags.')
      })
  }, [])

  const taggedInitiatives = initiatives
    .filter(initiative =>
      initiative.tags.some(tag =>
        Number(tag) === Number(tagSlug)
      )
    )
  let tag
  for (const t of tags) {
    if (t.slug === tagSlug) {
      tag = t
      break
    }
  }
  return (
        <div>
            <h2>Tag page</h2>
            <h3>ID: {tagSlug}</h3>
            <h3>Title: {tag?.title}</h3>
            {renderCardCollection(taggedInitiatives)}
        </div>
  )
}

export default TagPage
