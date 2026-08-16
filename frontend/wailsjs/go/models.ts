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
	export class UpdateInfo {
	    current: string;
	    latest: string;
	    available: boolean;
	    html_url: string;
	    download_url: string;
	    error: string;
	
	    static createFrom(source: any = {}) {
	        return new UpdateInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.current = source["current"];
	        this.latest = source["latest"];
	        this.available = source["available"];
	        this.html_url = source["html_url"];
	        this.download_url = source["download_url"];
	        this.error = source["error"];
	    }
	}

}

