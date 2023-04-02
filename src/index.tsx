import ReactDOM from 'react-dom/client';
import { useState, useEffect, useRef } from "react";
import * as esbuild from 'esbuild-wasm';
import { unpkgPathPlugin } from './plugins/unpkg-path-plugin';

const App = () => {

    const ref = useRef<any>();
    const [input, setInput] = useState("");
    const [code, setCode] = useState("");

    const startService = async () => {
        ref.current = await esbuild.startService({
            worker: true,
            wasmURL: '/esbuild.wasm'
        });
    }

    useEffect(() => {
        startService();
    }, [])

    const onSubmit = async () => {
        if (!ref.current) {
            return;
        }
        const result = await ref.current.build({
            entryPoints: ['index.js'],
            bundle: true,
            write: false,
            plugins: [unpkgPathPlugin(input)],
            define: {
                'process.env.NODE_ENV': '"production"',
                global: 'window',
            }
        })
        console.log(result);
        setCode(result.outputFiles[0].text);
    }

    return (
        <div>
            <textarea rows={20} cols={100} value={input} onChange={e => setInput(e.target.value)}></textarea>
            <div>
                <button onClick={onSubmit}>Submit</button>
            </div>
            <pre>{code}</pre>
        </div>);
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
    <App />
);
