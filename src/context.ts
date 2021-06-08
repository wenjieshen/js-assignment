import Quadtree from '@timohausmann/quadtree-js'
import * as PIXI from 'pixi.js'
import { SimplePath, SimpleNode } from './simplePath'
import { StateCtrl } from './stateControl'
export interface Context{
    app:PIXI.Application|null
    currentPath?:SimplePath|null
    controller:StateCtrl
    mapping:Map<PIXI.Graphics, SimpleNode>
    owner:Map<SimpleNode, SimplePath>
    pointTree?:Quadtree|null
    lineTree?:Quadtree|null
    path:SimplePath[]
}
