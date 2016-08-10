declare namespace path {
    const delimiter: string;
    const sep: string;
    const win32: any;
    function basename(path: any, ext: any): any;
    function dirname(path: any): any;
    function extname(path: any): any;
    function format(pathObject: any): any;
    function isAbsolute(path: any): any;
    function join(args: any[]): any;
    function normalize(path: any): any;
    function parse(pathString: any): any;
    function relative(from: any, to: any): any;
    function resolve(args: any[]): any;
    namespace posix {
        const delimiter: string;
        const sep: string;
        function basename(path: any, ext: any): any;
        function dirname(path: any): any;
        function extname(path: any): any;
        function format(pathObject: any): any;
        function isAbsolute(path: any): any;
        function join(args: any[]): any;
        function normalize(path: any): any;
        function parse(pathString: any): any;
        function relative(from: any, to: any): any;
        function resolve(args: any[]): any;
    }
}
