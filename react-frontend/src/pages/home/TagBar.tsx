import React, { useState, useEffect, startTransition } from 'react'
import { GeoBoundingBox } from '../../lib/BoundingBox'
import TopTagButton from './TopTagButton'
import { type Initiative, type Tag, useFilteredInitiatives } from '../../lib/KesApi'
import { TagContainer } from './Home'

export function TagBar ({ tags, urlActiveTags, setHomeTags, searchQuery, bb }: { tags: Tag[], urlActiveTags: string[], setHomeTags: (tags: string[]) => void, searchQuery: string, bb: GeoBoundingBox | 'Show all' | 'Hide global' }): React.JSX.Element {
  function calculateTagEntropy (initiatives: Initiative[]): Record<string, number> {
    const tagCount = initiatives.reduce((map, initiative) => initiative.tags.reduce((map, tag) => {
      const n = map.get(tag)
      if (typeof n !== 'undefined') {
        map.set(tag, n + 1)
      } else {
        map.set(tag, 1)
      }
      return map
    },
    map),
    new Map<string, number>())
    return Object.fromEntries(tags.map((tag: Tag) => {
      const tc = tagCount.get(tag.slug)
      if (typeof tc !== 'undefined') {
        return [tag.slug, tc * (initiatives.length - tc)]
      } else {
        return [tag.slug, 0]
      }
    }))
  }
  function sortTagsByEntropy (tagA: Tag, tagB: Tag): number {
    return tagEntropy[tagB.slug] - tagEntropy[tagA.slug]
  }
  function toggleActiveTag (tagSlug: string): void {
    if (barActiveTags.includes(tagSlug)) {
      const newTagList = barActiveTags.filter((ts: string) => ts !== tagSlug)
      setBarTags(newTagList)
    } else {
      setBarTags([...barActiveTags, tagSlug])
    }
  }

  const [barActiveTags, setBarTags] = useState<string[]>(urlActiveTags)
  useEffect(() => {
    startTransition(() => {
      setHomeTags(barActiveTags)
    })
  }, [barActiveTags])

  const initiatives = useFilteredInitiatives(barActiveTags, searchQuery, bb)
  const tagEntropy = calculateTagEntropy(initiatives)

  const TOP_TAGS_LIMIT = 6
  let topAvailableTags = tags
    .filter((tag: Tag) => tagEntropy[tag.slug] > 0)
  topAvailableTags.sort(sortTagsByEntropy)
  topAvailableTags = topAvailableTags.slice(0, TOP_TAGS_LIMIT) // Limit top tags

  return <TagContainer className="d-flex flex-row mb-2 mt-3 overflowX-scroll">
    {barActiveTags.map((tagSlug) => <TopTagButton
      key={tagSlug}
      title={tags.find(tag => tag.slug === tagSlug)?.title ?? ''}
      onClick={() => { toggleActiveTag(tagSlug) }}
      active={true} />
    )}
    {topAvailableTags.map((tagElement: Tag) => <TopTagButton
      key={tagElement.title}
      title={tagElement.title}
      onClick={() => { toggleActiveTag(tagElement.slug) }}
      active={(() => barActiveTags.includes(tagElement.slug)
      )()} />
    )}

  </TagContainer>
}
