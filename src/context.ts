import Quadtree from '@timohausmann/quadtree-js'
import * as PIXI from 'pixi.js'
import { SimplePath, SimpleNode } from './simplePath'
import { StateController } from './stateController'
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
    editingPath:SimplePath|null
    selectedNode:SimpleNode[]
    controller:StateController
    map2PIXI:WeakMap<SimpleNode, PIXI.Graphics>
    map2Node:WeakMap<PIXI.DisplayObject, SimpleNode>
    owner:WeakMap<SimpleNode, SimplePath>
    pointTree?:Quadtree|null
    paths:SimplePath[]
    setting:Setting
}
