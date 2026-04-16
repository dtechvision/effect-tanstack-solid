import * as Schema from "effect/Schema"
import * as Rpc from "effect/unstable/rpc/Rpc"
import * as RpcGroup from "effect/unstable/rpc/RpcGroup"
import {
  CreateTodoInput,
  Todo,
  TodoDashboardSnapshot,
  TodoGroup,
  TodoId,
  TodoNotFound,
  TodoStats,
  UpdateTodoInput,
} from "./todo-schema"

/**
 * RPC group for todo operations.
 * Defines all RPC methods with their success/error types.
 */
export class TodosRpc extends RpcGroup
  .make(
    Rpc.make("list", {
      success: Schema.Array(Todo),
    }),
    Rpc.make("stats", {
      success: TodoStats,
    }),
    Rpc.make("groups", {
      success: Schema.Array(TodoGroup),
    }),
    Rpc.make("snapshot", {
      success: TodoDashboardSnapshot,
    }),
    Rpc.make("getById", {
      success: Todo,
      error: TodoNotFound,
      payload: { id: TodoId },
    }),
    Rpc.make("create", {
      success: TodoDashboardSnapshot,
      payload: { input: CreateTodoInput },
    }),
    Rpc.make("update", {
      success: TodoDashboardSnapshot,
      error: TodoNotFound,
      payload: { id: TodoId, input: UpdateTodoInput },
    }),
    Rpc.make("remove", {
      success: TodoDashboardSnapshot,
      error: TodoNotFound,
      payload: { id: TodoId },
    }),
  )
  .prefix("todos_")
{}

/**
 * Domain RPC exports all todo RPC methods.
 */
export class DomainRpc extends TodosRpc {}
