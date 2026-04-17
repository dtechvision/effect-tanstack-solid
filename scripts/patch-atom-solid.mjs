#!/usr/bin/env node
/**
 * Post-install patch for @effect/atom-solid to support Solid 2.0
 * 
 * This script patches the official @effect/atom-solid package to work with Solid 2.0 beta.
 * Changes made:
 * 1. Remove createComputed (doesn't exist in Solid 2.0)
 * 2. Update createEffect to use split compute/apply phases
 * 3. Wrap signal values to avoid function type issues
 * 4. Update peer dependency to allow Solid 2.0
 * 
 * Patches both src/ (TypeScript) and dist/ (compiled JavaScript) files.
 */

import fs from 'fs'
import path from 'path'

const PKG_DIR = 'node_modules/@effect/atom-solid'
const HOOKS_TS = path.join(PKG_DIR, 'src/Hooks.ts')
const HOOKS_JS = path.join(PKG_DIR, 'dist/Hooks.js')
const REGISTRY_TS = path.join(PKG_DIR, 'src/RegistryContext.ts')
const REGISTRY_JS = path.join(PKG_DIR, 'dist/RegistryContext.js')
const PACKAGE_JSON = path.join(PKG_DIR, 'package.json')

function main() {
  console.log('🔧 Patching @effect/atom-solid for Solid 2.0 compatibility...')
  
  // Check if package exists
  if (!fs.existsSync(HOOKS_JS)) {
    console.log('⚠️  @effect/atom-solid dist not found, skipping patch')
    process.exit(0)
  }
  
  // Read current content
  let hooksJsContent = fs.readFileSync(HOOKS_JS, 'utf8')
  let packageContent = fs.readFileSync(PACKAGE_JSON, 'utf8')
  
  // Check if already patched
  if (hooksJsContent.includes('Solid 2.0')) {
    console.log('✅ Already patched, skipping')
    process.exit(0)
  }
  
  // ============ PATCH dist/Hooks.js (compiled JavaScript) ============
  
  // Patch 1: Update imports - remove createComputed and createResource
  hooksJsContent = hooksJsContent.replace(
    'import { createComputed, createEffect, createMemo, createResource, createSignal, onCleanup, useContext } from "solid-js"',
    'import { createEffect, createMemo, createSignal, onCleanup, useContext } from "solid-js"'
  )
  
  // Patch 2: Replace createAtomAccessor function
  const oldCreateAtomAccessorJs = `function createAtomAccessor(registry, atom) {
  const [value, setValue] = createSignal(null);
  createComputed(() => {
    onCleanup(registry.subscribe(atom(), setValue, constImmediate));
  });
  return value;
}`
  
  const newCreateAtomAccessorJs = `function createAtomAccessor(registry, atom) {
  // Solid 2.0: use createEffect with split compute/apply phases
  const [signal, setSignal] = createSignal({ v: null });
  createEffect(
    () => atom(),
    (currentAtom) => {
      const unsubscribe = registry.subscribe(currentAtom, (newValue) => {
        setSignal({ v: newValue });
      }, constImmediate);
      onCleanup(unsubscribe);
      try {
        setSignal({ v: registry.get(currentAtom) });
      } catch {}
    }
  );
  return () => signal().v;
}`
  
  hooksJsContent = hooksJsContent.replace(oldCreateAtomAccessorJs, newCreateAtomAccessorJs)
  
  // Patch 3: Replace mountAtom function
  const oldMountAtomJs = `function mountAtom(registry, atom) {
  createComputed(() => {
    onCleanup(registry.mount(atom()));
  });
}`
  
  const newMountAtomJs = `function mountAtom(registry, atom) {
  createEffect(
    () => atom(),
    (currentAtom) => {
      onCleanup(registry.mount(currentAtom));
    }
  );
}`
  
  hooksJsContent = hooksJsContent.replace(oldMountAtomJs, newMountAtomJs)
  
  // Patch 4: Replace useAtomSubscribe function
  const oldUseAtomSubscribeJs = `export const useAtomSubscribe = (atom, f, options) => {
  const registry = useContext(RegistryContext);
  createEffect(() => {
    onCleanup(registry.subscribe(atom(), f, options));
  });
}`
  
  const newUseAtomSubscribeJs = `export const useAtomSubscribe = (atom, f, options) => {
  const registry = useContext(RegistryContext);
  createEffect(
    () => atom(),
    (currentAtom) => {
      onCleanup(registry.subscribe(currentAtom, f, options));
    }
  );
}`
  
  hooksJsContent = hooksJsContent.replace(oldUseAtomSubscribeJs, newUseAtomSubscribeJs)
  
  // Patch 5: Replace useAtomRef function
  const oldUseAtomRefJs = `export const useAtomRef = ref => {
  const [value, setValue] = createSignal(null);
  createComputed(() => {
    const r = ref();
    setValue(r.value);
    onCleanup(r.subscribe(setValue));
  });
  return value;
}`
  
  const newUseAtomRefJs = `export const useAtomRef = ref => {
  const [signal, setSignal] = createSignal({ v: null });
  createEffect(
    () => ref(),
    (r) => {
      setSignal({ v: r.value });
      onCleanup(r.subscribe((v) => setSignal({ v })));
    }
  );
  return () => signal().v;
}`
  
  hooksJsContent = hooksJsContent.replace(oldUseAtomRefJs, newUseAtomRefJs)
  
  // Patch 6: Remove useAtomResource (uses createResource which doesn't exist in Solid 2.0)
  // Replace with a stub that throws
  const oldUseAtomResourceJs = `export const useAtomResource = (atom, options) => {
  const result = useAtomValue(atom);
  return createResource(result, result => {
    if (AsyncResult.isInitial(result) || options?.suspendOnWaiting && result.waiting) {
      return constUnresolvedPromise;
    } else if (AsyncResult.isSuccess(result)) {
      return Promise.resolve(result.value);
    }
    return Promise.reject(Cause.squash(result.cause));
  });
};`
  
  const newUseAtomResourceJs = `export const useAtomResource = (atom, options) => {
  throw new Error("useAtomResource is not supported in Solid 2.0. Use useAtomValue with Suspense instead.");
};`
  
  hooksJsContent = hooksJsContent.replace(oldUseAtomResourceJs, newUseAtomResourceJs)
  
  // Write JS changes
  fs.writeFileSync(HOOKS_JS, hooksJsContent)
  console.log('✅ Patched dist/Hooks.js')
  
  // ============ PATCH src/Hooks.ts (TypeScript source) ============
  if (fs.existsSync(HOOKS_TS)) {
    let hooksTsContent = fs.readFileSync(HOOKS_TS, 'utf8')
    
    // Patch 1: Update imports - remove createComputed and createResource, add SignalOptions
    hooksTsContent = hooksTsContent.replace(
      'import { createComputed, createEffect, createMemo, createResource, createSignal, onCleanup, useContext } from "solid-js"',
      'import { createEffect, createMemo, createSignal, onCleanup, useContext, type SignalOptions } from "solid-js"'
    )
    
    // Patch 2: Replace createAtomAccessor function
    const oldCreateAtomAccessorTs = `function createAtomAccessor<A>(registry: AtomRegistry.AtomRegistry, atom: () => Atom.Atom<A>): Accessor<A> {
  const [value, setValue] = createSignal<A>(null as any)
  createComputed(() => {
    onCleanup(registry.subscribe(atom(), setValue as any, constImmediate))
  })
  return value
}`
    
    const newCreateAtomAccessorTs = `function createAtomAccessor<A>(registry: AtomRegistry.AtomRegistry, atom: () => Atom.Atom<A>): Accessor<A> {
  // Solid 2.0: use createEffect with split compute/apply phases
  const [signal, setSignal] = createSignal<{ v: A }>({ v: null as A }, { equals: false } as SignalOptions<{ v: A }>)
  createEffect(
    () => atom(),
    (currentAtom) => {
      const unsubscribe = registry.subscribe(currentAtom, (newValue) => {
        setSignal({ v: newValue })
      }, constImmediate)
      onCleanup(unsubscribe)
      try { setSignal({ v: registry.get(currentAtom) }) } catch {}
    }
  )
  return () => signal().v
}`
    
    hooksTsContent = hooksTsContent.replace(oldCreateAtomAccessorTs, newCreateAtomAccessorTs)
    
    // Patch 3: Replace mountAtom function
    const oldMountAtomTs = `function mountAtom<A>(registry: AtomRegistry.AtomRegistry, atom: () => Atom.Atom<A>): void {
  createComputed(() => {
    onCleanup(registry.mount(atom()))
  })
}`
    
    const newMountAtomTs = `function mountAtom<A>(registry: AtomRegistry.AtomRegistry, atom: () => Atom.Atom<A>): void {
  createEffect(
    () => atom(),
    (currentAtom) => {
      onCleanup(registry.mount(currentAtom))
    }
  )
}`
    
    hooksTsContent = hooksTsContent.replace(oldMountAtomTs, newMountAtomTs)
    
    // Patch 4: Replace useAtomSubscribe function
    const oldUseAtomSubscribeTs = `export const useAtomSubscribe = <A>(
  atom: () => Atom.Atom<A>,
  f: (_: A) => void,
  options?: { readonly immediate?: boolean }
): void => {
  const registry = useContext(RegistryContext)
  createEffect(() => {
    onCleanup(registry.subscribe(atom(), f, options))
  })
}`
    
    const newUseAtomSubscribeTs = `export const useAtomSubscribe = <A>(
  atom: () => Atom.Atom<A>,
  f: (_: A) => void,
  options?: { readonly immediate?: boolean }
): void => {
  const registry = useContext(RegistryContext)
  createEffect(
    () => atom(),
    (currentAtom) => {
      onCleanup(registry.subscribe(currentAtom, f, options))
    }
  )
}`
    
    hooksTsContent = hooksTsContent.replace(oldUseAtomSubscribeTs, newUseAtomSubscribeTs)
    
    // Patch 5: Replace useAtomRef function
    const oldUseAtomRefTs = `export const useAtomRef = <A>(ref: () => AtomRef.ReadonlyRef<A>): Accessor<A> => {
  const [value, setValue] = createSignal(null as A)
  createComputed(() => {
    const r = ref()
    setValue(r.value as any)
    onCleanup(r.subscribe(setValue))
  })
  return value
}`
    
    const newUseAtomRefTs = `export const useAtomRef = <A>(ref: () => AtomRef.ReadonlyRef<A>): Accessor<A> => {
  const [signal, setSignal] = createSignal<{ v: A }>({ v: null as A }, { equals: false } as SignalOptions<{ v: A }>)
  createEffect(
    () => ref(),
    (r) => {
      setSignal({ v: r.value as A })
      onCleanup(r.subscribe((v) => setSignal({ v })))
    }
  )
  return () => signal().v
}`
    
    hooksTsContent = hooksTsContent.replace(oldUseAtomRefTs, newUseAtomRefTs)
    
    // Patch 6: Update useAtomResource to throw
    const oldUseAtomResourceTs = `export const useAtomResource = <A, E>(
  atom: () => Atom.Atom<AsyncResult.AsyncResult<A, E>>,
  options?: ResourceOptions<A> & {
    readonly suspendOnWaiting?: boolean | undefined
  }
): ResourceReturn<A, void> => {
  const result = useAtomValue(atom)
  return createResource(result, (result) => {
    if (AsyncResult.isInitial(result) || (options?.suspendOnWaiting && result.waiting)) {
      return constUnresolvedPromise
    } else if (AsyncResult.isSuccess(result)) {
      return Promise.resolve(result.value)
    }
    return Promise.reject(Cause.squash(result.cause))
  })
}`
    
    const newUseAtomResourceTs = `export const useAtomResource = <A, E>(
  _atom: () => Atom.Atom<AsyncResult.AsyncResult<A, E>>,
  _options?: ResourceOptions<A> & {
    readonly suspendOnWaiting?: boolean | undefined
  }
): ResourceReturn<A, void> => {
  throw new Error("useAtomResource is not supported in Solid 2.0. Use useAtomValue with Suspense instead.")
}`
    
    hooksTsContent = hooksTsContent.replace(oldUseAtomResourceTs, newUseAtomResourceTs)
    
    fs.writeFileSync(HOOKS_TS, hooksTsContent)
    console.log('✅ Patched src/Hooks.ts')
  }
  
  // ============ PATCH RegistryContext files (Solid 2.0 context API change) ============
  // Solid 2.0: createContext() returns the Provider directly, not { Provider, ... }
  
  if (fs.existsSync(REGISTRY_JS)) {
    let registryJsContent = fs.readFileSync(REGISTRY_JS, 'utf8')
    registryJsContent = registryJsContent.replace(
      'return createComponent(RegistryContext.Provider, {',
      '// Solid 2.0: RegistryContext IS the Provider\n  return createComponent(RegistryContext, {'
    )
    fs.writeFileSync(REGISTRY_JS, registryJsContent)
    console.log('✅ Patched dist/RegistryContext.js')
  }
  
  if (fs.existsSync(REGISTRY_TS)) {
    let registryTsContent = fs.readFileSync(REGISTRY_TS, 'utf8')
    registryTsContent = registryTsContent.replace(
      'return createComponent(RegistryContext.Provider, {',
      '// Solid 2.0: RegistryContext IS the Provider\n  return createComponent(RegistryContext, {'
    )
    fs.writeFileSync(REGISTRY_TS, registryTsContent)
    console.log('✅ Patched src/RegistryContext.ts')
  }
  
  // ============ PATCH package.json ============
  packageContent = packageContent.replace(
    '"solid-js": ">=1 <2"',
    '"solid-js": ">=1.9.0 || >=2.0.0-beta"'
  )
  fs.writeFileSync(PACKAGE_JSON, packageContent)
  console.log('✅ Patched package.json')
  
  console.log('✅ All patches applied successfully!')
}

main()
