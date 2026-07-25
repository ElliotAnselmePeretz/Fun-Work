import type { ParsedCategory, ParseResult } from './parseBulkText'

/**
 * Extracts a category/activity list from a photo or screenshot using Claude's
 * vision. The result is shaped into the same ParseResult the text parser
 * produces, so the preview and commit path are shared — the image is just a
 * second way to reach the same import.
 */

const MODEL = 'claude-opus-4-8'

/**
 * Long edge to downscale to before upload. Full-resolution phone screenshots
 * cost several times more image tokens without helping legibility of a plain
 * list, and this keeps requests small on a phone connection.
 */
const MAX_EDGE = 2000

const EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    categories: {
      type: 'array',
      description: 'Top-level groupings found in the image.',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'The category name.' },
          activities: {
            type: 'array',
            description: 'The items listed under this category.',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'The activity name.' },
              },
              required: ['name'],
              additionalProperties: false,
            },
          },
        },
        required: ['name', 'activities'],
        additionalProperties: false,
      },
    },
  },
  required: ['categories'],
  additionalProperties: false,
} as const

const SYSTEM = `You extract structured activity lists from images of notes, screenshots and handwritten pages.

Rules:
- Transcribe only what is actually visible. Never invent categories or activities.
- Headings, bold lines, or lines that group the items below them become categories.
- If the image is a flat list with no headings, return one category named "Imported".
- Keep the author's wording. Fix only obvious transcription slips.
- Ignore page furniture: dates, page numbers, checkboxes, and struck-through items.`

export interface ExtractedList {
  categories: ParsedCategory[]
}

/** Downscale and re-encode, returning raw base64 plus its media type. */
async function prepareImage(
  file: File,
): Promise<{ data: string; mediaType: 'image/jpeg' }> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Could not read that image.')
  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
  return { data: dataUrl.split(',')[1], mediaType: 'image/jpeg' }
}

export class MissingApiKeyError extends Error {
  constructor() {
    super('Add an Anthropic API key in Settings to use image import.')
    this.name = 'MissingApiKeyError'
  }
}

/**
 * `apiKey` is the user's own key, entered in Settings and stored only in this
 * browser. It is never bundled, and the request goes straight from the device
 * to Anthropic — there is no server in between to hold it.
 */
export async function extractListFromImage(
  file: File,
  apiKey: string,
): Promise<ParseResult> {
  if (!apiKey.trim()) throw new MissingApiKeyError()

  // Loaded on demand: the SDK is a large dependency and most people never
  // touch image import, so it shouldn't sit in the main bundle.
  const { default: Anthropic } = await import('@anthropic-ai/sdk')

  const client = new Anthropic({
    apiKey: apiKey.trim(),
    // This is a local-first app with no backend, so the call is made from the
    // page with a key the user pasted in themselves.
    dangerouslyAllowBrowser: true,
    defaultHeaders: { 'anthropic-dangerous-direct-browser-access': 'true' },
  })

  const { data, mediaType } = await prepareImage(file)

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    system: SYSTEM,
    thinking: { type: 'adaptive' },
    output_config: {
      effort: 'medium',
      format: { type: 'json_schema', schema: EXTRACTION_SCHEMA },
    },
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data } },
          {
            type: 'text',
            text: 'Extract every category and activity you can read in this image.',
          },
        ],
      },
    ],
  })

  if (response.stop_reason === 'refusal') {
    throw new Error('Claude declined to read that image. Try a different one.')
  }

  const text = response.content.find((block) => block.type === 'text')?.text
  if (!text) throw new Error('No list came back for that image.')

  return toParseResult(JSON.parse(text) as ExtractedList)
}

/** Reshape into the text parser's output so preview and commit are shared. */
function toParseResult(extracted: ExtractedList): ParseResult {
  const warnings: string[] = []
  const categories = extracted.categories
    .map((category) => ({
      name: category.name.trim(),
      activities: category.activities
        .map((activity) => ({
          name: activity.name.trim(),
        }))
        .filter((activity) => activity.name),
    }))
    .filter((category) => category.name)

  const empty = categories.filter((category) => category.activities.length === 0)
  if (empty.length > 0) {
    warnings.push(
      `${empty.length} categor${empty.length === 1 ? 'y has' : 'ies have'} no activities — check the image was fully in frame.`,
    )
  }

  return { categories, orphanActivities: [], warnings }
}
