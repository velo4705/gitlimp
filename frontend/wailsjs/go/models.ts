export namespace main {
	
	export class FileContent {
	    Path: string;
	    Name: string;
	    Content: string;
	    Error: string;
	    TabID: string;
	
	    static createFrom(source: any = {}) {
	        return new FileContent(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.Path = source["Path"];
	        this.Name = source["Name"];
	        this.Content = source["Content"];
	        this.Error = source["Error"];
	        this.TabID = source["TabID"];
	    }
	}
	export class RecentEntry {
	    path: string;
	    name: string;
	
	    static createFrom(source: any = {}) {
	        return new RecentEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.path = source["path"];
	        this.name = source["name"];
	    }
	}

}

