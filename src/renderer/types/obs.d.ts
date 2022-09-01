import { Scene as SceneOld } from 'obs-websocket-js'

export interface SceneV4 extends SceneOld {}

export interface SceneV5 {
  sceneIndex: number
  sceneName: string
}

export type Scene = SceneV4 | SceneV5
