export namespace main {
	
	export class BackgroundLuminance {
	    luminance: number;
	    isLight: boolean;
	    error?: string;
	
	    static createFrom(source: any = {}) {
	        return new BackgroundLuminance(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.luminance = source["luminance"];
	        this.isLight = source["isLight"];
	        this.error = source["error"];
	    }
	}
	export class Task {
	    id: number;
	    text: string;
	    completed: boolean;
	    parentId?: number;
	    level: number;
	    isExpanded: boolean;
	    sortOrder: number;
	    children?: Task[];
	
	    static createFrom(source: any = {}) {
	        return new Task(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.text = source["text"];
	        this.completed = source["completed"];
	        this.parentId = source["parentId"];
	        this.level = source["level"];
	        this.isExpanded = source["isExpanded"];
	        this.sortOrder = source["sortOrder"];
	        this.children = this.convertValues(source["children"], Task);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

