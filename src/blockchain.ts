import { hash, isHashProofed } from './helpers'
import { Block } from './types'

export class Blockchain {
  #chain: Block[] = []
  private proofOfWorkPrefix = '0'

  constructor(private readonly dificuldade: number = 4) {
    this.#chain.push(this.createGenesisBlock())
  }

  private createGenesisBlock() {
    const payload = {
      sequence: 0,
      timestamp: Number(new Date()),
      data: 'Genesis Block',
      previousHash: ''
    }

    return {
      header: {
        nonce: 0,
        blockHash: hash(JSON.stringify(payload))
      },
      payload
    }
  }

  private get lastBlock(): Block {
    return this.#chain.at(-1) as Block
  }

  get chain() {
    return this.#chain
  }

  private getPreviousBlockHash() {
    return this.lastBlock.header.blockHash
  }

  createBlock(data: any) {
    const newBlock = {
      sequence: this.lastBlock.payload.sequence + 1,
      timestamp: +new Date(),
      data,
      previousHash: this.getPreviousBlockHash()
    }

    console.log(`Bloco criado ${newBlock.sequence}: ${JSON.stringify(newBlock, null, 2)}`)
    return newBlock
  }

  mineBlock(block: Block['payload']) {
    let nonce = 0
    let startTime = +new Date()

    while (true) {
      const blockHash = hash(JSON.stringify(block))
      const proofingHash = hash(blockHash + nonce)

      if (
        isHashProofed({
          hash: proofingHash,
          difficulty: this.dificuldade,
          prefix: this.proofOfWorkPrefix
        })
      ) {
        const endTime = +new Date()
        const shortHash = blockHash.slice(0, 12)
        const mineTime = (endTime - startTime) / 1000

        console.log(
          `Bloco minerado ${block.sequence} em ${mineTime} segundos. Hash: ${shortHash} (${nonce} tentativas)`
        )

        return {
          minedBlock: { payload: { ...block }, header: { nonce, blockHash } },
          minedHash: proofingHash,
          shortHash,
          mineTime
        }
      }

      nonce++
    }
  }

  verifyBlock(block: Block) {
    if (block.payload.previousHash !== this.getPreviousBlockHash()) {
      console.error(
        `Bloco inválido #${block.payload.sequence}: Hash do bloco anterior é "${this.getPreviousBlockHash().slice(
          0,
          12
        )}" not "${block.payload.previousHash.slice(0, 12)}"`
      )

      return
    }

    if (
      !isHashProofed({
        hash: hash(hash(JSON.stringify(block.payload)) + block.header.nonce),
        difficulty: this.dificuldade,
        prefix: this.proofOfWorkPrefix
      })
    ) {
      console.error(
        `Bloco inválido #${block.payload.sequence}: Hash não verificado, nonce ${block.header.nonce} não é válido`
      )

      return
    }

    return true
  }

  pushBlock(block: Block) {
    if (this.verifyBlock(block)) this.#chain.push(block)
    console.log(`Bloco adicionado #${JSON.stringify(block, null, 2)}`)
    return this.#chain
  }
}
