import * as esbuild from 'esbuild-wasm';
import axios from 'axios';
import localforage from 'localforage';

const fileCache = localforage.createInstance({
    name: 'fileCache'
});

export const unpkgPathPlugin = (input: string) => {
    return {
        name: 'unpkg-path-plugin',
        setup(build: esbuild.PluginBuild) {

            // Handle root entry file 'index.js'
            build.onResolve({ filter: /(^index\.js$)/ }, () => {
                return { path: 'index.js', namespace: 'a' };
            })

            // Handle relative paths in a module
            build.onResolve({ filter: /^\.+\// }, async (args: any) => {
                return {
                    namespace: 'a',
                    path: new URL(args.path, 'https://unpkg.com' + args.resolveDir + '/').href
                }
            })

            // Handle main file of a module
            build.onResolve({ filter: /.*/ }, async (args: any) => {
                return { path: `https://unpkg.com/${args.path}`, namespace: 'a' };
            });

            build.onLoad({ filter: /.*/ }, async (args: any) => {
                console.log('onLoad', args);

                if (args.path === 'index.js') {
                    return {
                        loader: 'jsx',
                        contents: input,
                    };
                }

                const cachedResult = await fileCache.getItem<esbuild.OnLoadResult>(args.path);

                if (cachedResult) {
                    return cachedResult;
                }

                const { data, request } = await axios.get(args.path);

                const result: esbuild.OnLoadResult = {
                    loader: 'jsx',
                    contents: data,
                    resolveDir: new URL('./', request.responseURL).pathname
                }
                await fileCache.setItem(args.path, result);

                return result;
            });
        },
    };
};