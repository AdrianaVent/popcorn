import type { TFunction } from 'i18next'

const CHARACTER_TERMS: Array<[RegExp, string]> = [
  [/\barchive footage\b/gi, 'character.archiveFootage'],
  [/\bhimself\b/gi,         'character.self'],
  [/\bherself\b/gi,         'character.self'],
  [/\bthemselves\b/gi,      'character.self'],
  [/\bself\b/gi,            'character.self'],
  [/\bvoice\b/gi,           'character.voice'],
  [/\bnarrator\b/gi,        'character.narrator'],
  [/\bguest\b/gi,           'character.guest'],
  [/\(uncredited\)/gi,      'character.uncredited'],
]

const JOB_TERMS: Array<[RegExp, string]> = [
  [/^executive producer$/i,        'job.executiveProducer'],
  [/^co-producer$/i,               'job.coProducer'],
  [/^director of photography$/i,   'job.dop'],
  [/^original music composer$/i,   'job.composer'],
  [/^visual effects supervisor$/i, 'job.vfxSupervisor'],
  [/^stunt coordinator$/i,         'job.stuntCoordinator'],
  [/^production design(?:er)?$/i,  'job.productionDesign'],
  [/^costume design(?:er)?$/i,     'job.costumeDesign'],
  [/^actor's assistant$/i,         'job.actorsAssistant'],
  [/^screenplay$/i,                'job.screenplay'],
  [/^story$/i,                     'job.story'],
  [/^writer$/i,                    'job.writer'],
  [/^casting$/i,                   'job.casting'],
  [/^producer$/i,                  'job.producer'],
  [/^director$/i,                  'job.director'],
  [/^editor$/i,                    'job.editor'],
]

export function translateCharacter(character: string, t: TFunction): string {
  if (!character) return character
  let result = character
  for (const [pattern, key] of CHARACTER_TERMS) {
    result = result.replace(pattern, (match) => t(key, { defaultValue: match }))
  }
  return result
}

export function translateJob(job: string, t: TFunction): string {
  if (!job) return job
  for (const [pattern, key] of JOB_TERMS) {
    if (pattern.test(job)) return t(key, { defaultValue: job })
  }
  return job
}
