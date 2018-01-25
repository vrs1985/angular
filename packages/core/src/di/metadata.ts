/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {ClassSansProvider, ConstructorProvider, ConstructorSansProvider, ExistingProvider, ExistingSansProvider, FactoryProvider, FactorySansProvider, StaticClassProvider, StaticClassSansProvider, ValueProvider, ValueSansProvider} from '../di/provider';
import {ReflectionCapabilities} from '../reflection/reflection_capabilities';
import {Type} from '../type';
import {makeDecorator, makeParamDecorator} from '../util/decorators';
import {getClosureSafeProperty} from '../util/property';
import { EMPTY_ARRAY } from '../view/util';

const GET_PROPERTY_NAME = {} as any;
const USE_VALUE = getClosureSafeProperty<ValueProvider>(
    {provide: String, useValue: GET_PROPERTY_NAME}, GET_PROPERTY_NAME);

/**
 * Type of the Inject decorator / constructor function.
 *
 * @stable
 */
export interface InjectDecorator {
  /**
   * @whatItDoes A parameter decorator that specifies a dependency.
   * @howToUse
   * ```
   * @Injectable()
   * class Car {
   *   constructor(@Inject("MyEngine") public engine:Engine) {}
   * }
   * ```
   *
   * @description
   * For more details, see the {@linkDocs guide/dependency-injection "Dependency Injection Guide"}.
   *
   * ### Example
   *
   * {@example core/di/ts/metadata_spec.ts region='Inject'}
   *
   * When `@Inject()` is not present, {@link Injector} will use the type annotation of the
   * parameter.
   *
   * ### Example
   *
   * {@example core/di/ts/metadata_spec.ts region='InjectWithoutDecorator'}
   *
   * @stable
   */
  (token: any): any;
  new (token: any): Inject;
}

/**
 * Type of the Inject metadata.
 *
 * @stable
 */
export interface Inject { token: any; }

/**
 * Inject decorator and metadata.
 *
 * @stable
 * @Annotation
 */
export const Inject: InjectDecorator = makeParamDecorator('Inject', (token: any) => ({token}));


/**
 * Type of the Optional decorator / constructor function.
 *
 * @stable
 */
export interface OptionalDecorator {
  /**
   * @whatItDoes A parameter metadata that marks a dependency as optional.
   * {@link Injector} provides `null` if the dependency is not found.
   * @howToUse
   * ```
   * @Injectable()
   * class Car {
   *   constructor(@Optional() public engine:Engine) {}
   * }
   * ```
   *
   * @description
   * For more details, see the {@linkDocs guide/dependency-injection "Dependency Injection Guide"}.
   *
   * ### Example
   *
   * {@example core/di/ts/metadata_spec.ts region='Optional'}
   *
   * @stable
   */
  (): any;
  new (): Optional;
}

/**
 * Type of the Optional metadata.
 *
 * @stable
 */
export interface Optional {}

/**
 * Optional decorator and metadata.
 *
 * @stable
 * @Annotation
 */
export const Optional: OptionalDecorator = makeParamDecorator('Optional');


/**
 * Injectable providers used in `@Injectable` decorator.
 *
 * @experimental
 */
export type InjectableProvider = ValueSansProvider | ExistingSansProvider |
    StaticClassSansProvider | ConstructorSansProvider | FactorySansProvider | ClassSansProvider;

/**
 * Type of the Injectable decorator / constructor function.
 *
 * @stable
 */
export interface InjectableDecorator {
  /**
   * @whatItDoes A marker metadata that marks a class as available to {@link Injector} for creation.
   * @howToUse
   * ```
   * @Injectable()
   * class Car {}
   * ```
   *
   * @description
   * For more details, see the {@linkDocs guide/dependency-injection "Dependency Injection Guide"}.
   *
   * ### Example
   *
   * {@example core/di/ts/metadata_spec.ts region='Injectable'}
   *
   * {@link Injector} will throw an error when trying to instantiate a class that
   * does not have `@Injectable` marker, as shown in the example below.
   *
   * {@example core/di/ts/metadata_spec.ts region='InjectableThrows'}
   *
   * @stable
   */
  (): any;
  (options?: {scope: Type<any>} & InjectableProvider): any;
  new (): Injectable;
  new (options?: {scope: Type<any>} & InjectableProvider): Injectable;
}

/**
 * Type of the Injectable metadata.
 *
 * @experimental
 */
export interface Injectable {
  scope?: Type<any>;
  factory: () => any;
}

/**
 * Type representing injectable service.
 *
 * @experimental
 */
export interface InjectableType<T> extends Type<T> { ngInjectableDef?: Injectable; }

export function injectArgs(types: any[]): any[] {
  const args: any[] = [];
  for(let i = 0; i < types.length; i++) {
    const arg = types[i];
    if (Array.isArray(arg)) {
      if (arg.length === 0) {
        throw new Error('Arguments array must have arguments.');
      }
      let type: Type<any>|undefined  = undefined;
      let defaultValue: null|undefined = undefined;
      debugger;
      
      for (let j = 0; j < arg.length; j++) {
        const meta = arg[j];
        console.log(meta);
        if (meta instanceof Optional || meta.__proto__.ngMetadataName === 'Optional') {
          defaultValue = null;
        } else if (meta instanceof Inject) {
          type = meta.token;
        } else {
          type = meta;
        }
      }

      args.push(inject(type, undefined, defaultValue));
    } else {
      args.push(inject(arg));
    }
  }
  return args;
}

function convertInjectableProviderToFactory(
    type: Type<any>, provider?: InjectableProvider): () => any {
  if (!provider) {
    const reflectionCapabilities = new ReflectionCapabilities();
    const deps = reflectionCapabilities.parameters(type);
    return () => new type(...injectArgs(deps));
  }

  if (USE_VALUE in provider) {
    const valueProvider = (provider as ValueSansProvider);
    return () => valueProvider.useValue;
  } else if ((provider as ExistingSansProvider).useExisting) {
    const existingProvider = (provider as ExistingSansProvider);
    return () => inject(existingProvider.useExisting);
  } else if ((provider as FactorySansProvider).useFactory) {
    const factoryProvider = (provider as FactorySansProvider);
    return () => factoryProvider.useFactory(...injectArgs(factoryProvider.deps || EMPTY_ARRAY));
  } else if ((provider as StaticClassSansProvider | ClassSansProvider).useClass) {
    const classProvider = (provider as StaticClassSansProvider | ClassSansProvider);
    let deps = (provider as StaticClassSansProvider).deps;
    if (!deps) {
      const reflectionCapabilities = new ReflectionCapabilities();
      deps = reflectionCapabilities.parameters(type);
    }
    return () => new classProvider.useClass(...injectArgs(deps));
  } else {
    let deps = (provider as ConstructorSansProvider).deps;
    if (!deps) {
      const reflectionCapabilities = new ReflectionCapabilities();
      deps = reflectionCapabilities.parameters(type);
    }
    return () => new type(...injectArgs(deps!));
  }
}

/**
 * Define injectable
 *
 * @experimental
 */
export function defineInjectable(opts: Injectable): Injectable {
  return opts;
}

/**
 * Injectable decorator and metadata.
 *
 * @stable
 * @Annotation
 */
export const Injectable: InjectableDecorator = makeDecorator(
    'Injectable', undefined, undefined, undefined,
    (injectableType: Type<any>, options: {scope: Type<any>} & InjectableProvider) => {
      if (options && options.scope) {
        (injectableType as InjectableType<any>).ngInjectableDef =
            defineInjectable({
              scope: options.scope, 
              factory: convertInjectableProviderToFactory(injectableType, options)
            });
      }
    });

/**
 * Type of the Self decorator / constructor function.
 *
 * @stable
 */
export interface SelfDecorator {
  /**
   * @whatItDoes Specifies that an {@link Injector} should retrieve a dependency only from itself.
   * @howToUse
   * ```
   * @Injectable()
   * class Car {
   *   constructor(@Self() public engine:Engine) {}
   * }
   * ```
   *
   * @description
   * For more details, see the {@linkDocs guide/dependency-injection "Dependency Injection Guide"}.
   *
   * ### Example
   *
   * {@example core/di/ts/metadata_spec.ts region='Self'}
   *
   * @stable
   */
  (): any;
  new (): Self;
}

/**
 * Type of the Self metadata.
 *
 * @stable
 */
export interface Self {}

/**
 * Self decorator and metadata.
 *
 * @stable
 * @Annotation
 */
export const Self: SelfDecorator = makeParamDecorator('Self');


/**
 * Type of the SkipSelf decorator / constructor function.
 *
 * @stable
 */
export interface SkipSelfDecorator {
  /**
   * @whatItDoes Specifies that the dependency resolution should start from the parent injector.
   * @howToUse
   * ```
   * @Injectable()
   * class Car {
   *   constructor(@SkipSelf() public engine:Engine) {}
   * }
   * ```
   *
   * @description
   * For more details, see the {@linkDocs guide/dependency-injection "Dependency Injection Guide"}.
   *
   * ### Example
   *
   * {@example core/di/ts/metadata_spec.ts region='SkipSelf'}
   *
   * @stable
   */
  (): any;
  new (): SkipSelf;
}

/**
 * Type of the SkipSelf metadata.
 *
 * @stable
 */
export interface SkipSelf {}

/**
 * SkipSelf decorator and metadata.
 *
 * @stable
 * @Annotation
 */
export const SkipSelf: SkipSelfDecorator = makeParamDecorator('SkipSelf');

/**
 * Type of the Host decorator / constructor function.
 *
 * @stable
 */
export interface HostDecorator {
  /**
   * @whatItDoes Specifies that an injector should retrieve a dependency from any injector until
   * reaching the host element of the current component.
   * @howToUse
   * ```
   * @Injectable()
   * class Car {
   *   constructor(@Host() public engine:Engine) {}
   * }
   * ```
   *
   * @description
   * For more details, see the {@linkDocs guide/dependency-injection "Dependency Injection Guide"}.
   *
   * ### Example
   *
   * {@example core/di/ts/metadata_spec.ts region='Host'}
   *
   * @stable
   */
  (): any;
  new (): Host;
}

/**
 * Type of the Host metadata.
 *
 * @stable
 */
export interface Host {}

/**
 * Host decorator and metadata.
 *
 * @stable
 * @Annotation
 */
export const Host: HostDecorator = makeParamDecorator('Host');
