const { ApolloServer, gql, PubSub } = require("apollo-server");
const movies = require("./mocks/movies");
const categories = require("./mocks/categories");
const { getMoviesForCategory } = require("./utils");

const pubsub = new PubSub();

const typeDefs = gql`
  type Query {
    hello: String!
    getMovies(categoryName: String): [Movie!]
    getCategories: [Category!]
    getMovie(id: ID!): Movie
  }

  type Mutation {
    addVote(movie_id: ID!): Movie!
  }

  type Subscription {
    voteAdded: Movie
  }

  type Category {
    id: ID!
    name: String!
    movies: [Movie!]
  }

  type Movie {
    vote_count: Int!
    id: ID!
    video: Boolean!
    vote_average: Float!
    title: String!
    popularity: Float!
    poste_path: String!
    original_language: String!
    original_title: String!
    category_ids: [ID!]
    backdrop_path: String!
    adult: Boolean!
    overview: String!
    release_date: String!
    categories: [Category!]
  }
`;

const VOTE_ADDED = 'VOTE_ADDED';

const resolvers = {
  Query: {
    hello: (parent, args, ctx, info) => "Hello world!",
    getMovies: (parents, args, ctx, info) => {
      return args.categoryName ?
        getMoviesForCategory(args.categoryName) : movies
    },
    getCategories: (parents, args, ctx, info) => categories,
    getMovie: (parents, args, ctx, info) => {
      return movies.find(movie => movie.id == args.id)
    }
  },
  Mutation: {
    addVote: (parent, args, ctx, info) => {
      // Try to figure out what to do here
      const movie = movies.find(movie => movie.id == args.movie_id)
      movie.vote_count++
      pubsub.publish(VOTE_ADDED, { voteAdded: movie })
      return movie
    }
  },
  Subscription: {
    voteAdded: {
      // Additional event labels can be passed to asyncIterator creation
      subscribe: () => pubsub.asyncIterator([VOTE_ADDED]),
    },
  },
  Movie: {
    categories: (parent, args, ctx, info) => 
      // Return the categories
      parent.category_ids.map((id) => categories.find(element => element.id == id))
  },
  Category: {
    movies: (parent, args, ctx, info) => 
      movies.filter(movie => movie.category_ids.includes(parent.id))
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  cors: true,
  playground: {
    settings: {
      "editor.theme": "light"
    }
  }
});

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
