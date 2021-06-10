import Quadtree from '@timohausmann/quadtree-js'
import * as PIXI from 'pixi.js'
import { SimplePath, SimpleNode } from './simplePath'
import { StateCtrl } from './stateControl'
interface Setting{
    pointSize:number
    pointColor:number
    pointAlpha:number
    hitScale:number
    lineWidth:number
    lineColor:number
    lineAlpha:number
    helpLineWidth:number
    helpLineColor:number
    helpLineAlpha:number
    alignLineColor:number
    alignLineWidth:number
    alignLineAlpha:number
    alignTolerance:number
    defaultFillColor:number
    defaultBackColor:number
    defaultFillAlpha:number
}
export interface Context{
    app:PIXI.Application|null
    currentPath?:SimplePath|null
    controller:StateCtrl
    connection:Map<SimpleNode, PIXI.Graphics>
    mapping:Map<PIXI.Graphics, SimpleNode>
    owner:Map<SimpleNode, SimplePath>
    pointTree?:Quadtree|null
    path:SimplePath[]
    setting:Setting
}
