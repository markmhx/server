# Personal server

This repository contains the source code for a web server that acts as a personal API for an individual on the Web.

The server consumes files stored in a data directory and makes them publically available through a RESTful API that conforms to the [JSON API specification](http://jsonapi.org/). These files are formatted primarily in JSON but can also include secondary assets with any other format.

This server is initially intended to support [a personal web app](https://github.com/asheville/personal-web) but can serve any number of use cases that require public access to personal data made available by individuals.

## Setting up the data

A directory with the individual's personal data must be made available at a path indicated by the environment (see next section for how to indicate path). This directory can be placed at `data` within the base directory and it will be ignored by Git. 

Files within this directory should be organized into subdirectories named by type, all lower-case and with dashes used to indicate spaces. E.g. "posts" should be placed within a `posts` subdirectory and "athletic results" within the `athletic-results` subdirectory.

Within each directory, objects should be represented as JSON files that conform to the JSON API format and are named by their ID plus the ".json" extension. E.g. a post object within the `posts` directory could be located at `posts/15.json`.

If an object relates to another, it should use the relationship syntax dictated by the JSON API specification to do so. If it relates to a non-object resource, it should do so with an attribute containing a URL for that resource. Relative URLs can be used for resources served locally from within the `assets` subdirectory of the data directory.

Here is an example to illustrate how a poem object could be represented by a JSON file:

```
{
  "id": 10,
  "type": "poems",
  "attributes": {
    "title": "A haiku about data",
    "image-url": "/assets/data-haiku.png",
    "created-at": "2011-06-16T22:36:13-08:00",
    "published-at": "2011-06-17T21:51:23-08:00",
    "updated-at": "2011-06-22T23:05:20-08:00",
    "slug": "a-haiku-about-data",
    "body": "Data oh data\nHow you represent so much\nI wish to serve you"
  },
  "relationships": {
    "poetry-collection": {
      "data": {
        "type": "poetry-collections",
        "id": 8
      }
    }
  }
}
```

Note how the `image-url` attribute refers to a static asset hosted by the server at `/assets/data-haiku.png` and backed by a file stored at `assets/data-haiku.png` within the data directory. Note also how the object is related to another "poetry collection" object using a proper ID-based declaration at the bottom. This declaration implies that a file representing that poetry collection has been placed at `poetry-collections/8.json`  within the data directory.

Objects can also be stored as sets within "index.json" files for each type in addition or instead of as individual files for separate objects. E.g. the following array of JSON objects could be stored at "skills/index.js` within the data directory to maintain all skill objects in one file:

```
[{
  "id": 1,
  "type": "skills",
  "attributes": {
    "name": "Hunting",
    "description": "Deer, moose, rabbits"
  }
},{
  "id": 2,
  "type": "skills",
  "attributes": {
    "name": "Martial arts",
    "description": "Karate, nunchucks"
  }
},{
  "id": 3,
  "type": "skills",
  "attributes": {
    "name": "People",
    "description": "Listening, talking, nodding with approval"
  }
}]
```

Note that the server will have to be restarted to recognize the addition or subtraction of any object types within the data directory. Also any JSON files with ".backup" in their names will be ignored by the server unless placed within the "data/assets" subdirectory.

## Setting up the environment

The code requires the following environment variables to run or deploy the server. The following environment variables can be declared by adding a file named `.env` (in [INI format](https://en.wikipedia.org/wiki/INI_file)) to the base directory, assuming they're not declared elsewhere in the system already. Such a file will be ignored by Git.

## Optional

- `PERSONAL_SERVER_PORT`: Port through which to run the server locally (defaults to `9100`)
- `PERSONAL_SERVER_MODEL_DIRS`: Local system paths to data directories, comma-delimited (defaults to `data`)
- `PERSONAL_SERVER_PRESERVE_MODEL`: Set to "true" to prevent server from reloading all data files into Redis cache on start

The value of `PERSONAL_SERVER_MODEL_DIRS` can be set the absolute path of `data` within the repository and the directory will be ignored by Git.

## Running the server

Once the environment is ready per above, and [Node.js](http://nodejs.org/) with [NPM](https://www.npmjs.com/) is installed, simply run `npm install` to install dependencies and `node app.js` to fire the server up.

## Querying for data

Once the server is running, data can be queried with GET requests for either individual objects or sets of objects.

An individual object can be queried with a path segment indicating its type pluralized and another indicating its ID. E.g. the above poem with ID 10 could be queried at `/poems/10` and the server would return the file in its entirety as an "application/json" response encoded in UTF-8.

Sets of objects can be queried with a single path segment indicating the type pluralized. E.g. all poems could be queried at `/poems` and the server would respond with a compilation of all poems organized descending either by attribute ID or "published-at", depending on whether the latter is made available by the individual poem objects.

Note that if objects are stored as individual files, they can be queried either individually or as sets. But if they are stored as sets within "index.json" files, they can be queried only as sets.

As mentioned above, all files stored within `data/assets` can be queried with the `assets` path segment. E.g. a file stored at `data/assets/movies/hunting-summer-2012.avi` could be queried at `/assets/movies/hunting-summer-2012.avi`. Note how the "data" directory is not referenced by the URL path.

## Developing and deploying

You can run any of the following scripts to help with development:

- `npm run dev`: Runs the app and automatically reloads it when code changes are made during development

Deployment scripts are available through [Hoist](https://github.com/markmhx/grunt-hoist).