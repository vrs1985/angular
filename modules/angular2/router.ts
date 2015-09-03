/**
 * @module
 * @description
 * Maps application URLs into application states, to support deep-linking and navigation.
 */

export {Router, RootRouter} from './src/router/router';
export {RouterOutlet} from './src/router/router_outlet';
export {
  DynamicComponentLoader,
  ComponentRef,
  ElementRef,
  Compiler,
  AppViewManager,
  ViewRef,
  HostViewRef,
  ProtoViewRef,
  ViewContainerRef,
  TemplateRef
} from './core';
export {
  Renderer,
  RenderElementRef,
  RenderViewRef,
  RenderProtoViewRef,
  RenderEventDispatcher,
  RenderFragmentRef,
  RenderViewWithFragments
} from './render';
export {
  Binding,
  Injector,
  ResolvedBinding,
  Key,
  Dependency,
  ProtoInjector,
  DependencyProvider,
  BindingWithVisibility,
  Visibility,
  ResolvedFactory
} from './src/core/di';
export {RouterLink} from './src/router/router_link';
export {RouteParams} from './src/router/instruction';
export {RouteRegistry} from './src/router/route_registry';
export {LocationStrategy} from './src/router/location_strategy';
export {HashLocationStrategy} from './src/router/hash_location_strategy';
export {PathLocationStrategy} from './src/router/path_location_strategy';
export {PathRecognizer, PathMatch} from './src/router/path_recognizer';
export {RouteHandler} from './src/router/route_handler';
export {Location, APP_BASE_HREF} from './src/router/location';
export {Pipeline} from './src/router/pipeline';
export * from './src/router/route_config_decorator';
export * from './src/router/route_definition';
export {OnActivate, OnDeactivate, OnReuse, CanDeactivate, CanReuse} from './src/router/interfaces';
export {CanActivate} from './src/router/lifecycle_annotations';
export {Instruction, ComponentInstruction} from './src/router/instruction';
export {Url} from './src/router/url_parser';
export {OpaqueToken} from 'angular2/angular2';
export {ROUTE_DATA} from './src/router/route_data';

import {LocationStrategy} from './src/router/location_strategy';
import {PathLocationStrategy} from './src/router/path_location_strategy';
import {Router, RootRouter} from './src/router/router';
import {RouterOutlet} from './src/router/router_outlet';
import {RouterLink} from './src/router/router_link';
import {RouteRegistry} from './src/router/route_registry';
import {Pipeline} from './src/router/pipeline';
import {Location} from './src/router/location';
import {bind, OpaqueToken, Binding} from './core';
import {CONST_EXPR, Type} from './src/core/facade/lang';

export const ROUTER_PRIMARY_COMPONENT: OpaqueToken =
    CONST_EXPR(new OpaqueToken('RouterPrimaryComponent'));

export const ROUTER_DIRECTIVES: any[] = CONST_EXPR([RouterOutlet, RouterLink]);

/**
 * A list of {@link Binding}. To use the router, you must add this to your application.
 *
 * ## Example
 *
 * ```typescript
 * @Component({...})
 * @View({directives: [ROUTER_DIRECTIVES]})
 * @RouteConfig([
 *  new Route(...),
 * ])
 * class AppCmp {
 *  constructor(router: Router, location: Location) {
 *    // ...
 *  }
 *
 * }
 *
 *
 * bootstrap(AppCmp, [ROUTER_BINDINGS]);
 * ```
 */
export const ROUTER_BINDINGS: any[] = CONST_EXPR([
  RouteRegistry,
  Pipeline,
  CONST_EXPR(new Binding(LocationStrategy, {toClass: PathLocationStrategy})),
  Location,
  CONST_EXPR(new Binding(
      Router,
      {
        toFactory: routerFactory,
        deps: CONST_EXPR([RouteRegistry, Pipeline, Location, ROUTER_PRIMARY_COMPONENT])
      }))
]);

export interface InjectableReference {}

function routerFactory(registry, pipeline, location, primaryComponent) {
  return new RootRouter(registry, pipeline, location, primaryComponent);
}

export function routerBindings(primaryComponent: Type): Array<any> {
  return [ROUTER_BINDINGS, bind(ROUTER_PRIMARY_COMPONENT).toValue(primaryComponent)];
}
